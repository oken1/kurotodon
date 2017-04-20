"use strict";

////////////////////////////////////////////////////////////////////////////////
// タイムライン表示
////////////////////////////////////////////////////////////////////////////////
Contents.timeline = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var lines = cont.find( '.lines' );
	var setting = cont.find( '.setting' );
	var setting_show = false;
	var timeline_list;
	var badge;
	var newitems = $();
	var tm = null;
	var status_ids = {};
	var first_status_id = null;
	var last_status_id = null;
	var page = 1;
	var scrollPos = null;
	var scrollHeight = null;
	var loading = false;
	var stream_queue = new Array();
	var cursor_on_option = false;

	////////////////////////////////////////////////////////////
	// 読み込み済みステータスID数を取得
	////////////////////////////////////////////////////////////
	var StatusIDCount = function() {
		var cnt = 0;

		for ( var id in status_ids )
		{
			cnt++;
		}

		return cnt;
	}

	///////////////////////////////////////////////////////////////////
	// ツールバーユーザー/グループ設定/ツイ消しカードの情報を最新に更新
	///////////////////////////////////////////////////////////////////
	var UserInfoUpdate = function( users ) {

/* 仮
		var idx;
		var updflg = false;

		for ( var user_id in users )
		{
			// ツールバーユーザー
			for ( var idx = 0, _len = g_cmn.toolbar_user.length ; idx < _len ; idx++ )
			{
				if ( g_cmn.toolbar_user[idx].user_id == user_id )
				{
					// 日付が新しい場合のみ
					var datechk = false;

					if ( g_cmn.toolbar_user[idx].created_at == undefined )
					{
						datechk = true;
					}
					else
					{
						if ( DateConv( g_cmn.toolbar_user[idx].created_at, 0 ) < DateConv( users[user_id].created_at, 0 ) )
						{
							datechk = true;
						}
					}

					if ( datechk )
					{
						var chk = false;

						// アイコンに変更がないか？
						if ( g_cmn.toolbar_user[idx].icon != users[user_id].icon )
						{
							g_cmn.toolbar_user[idx].icon = users[user_id].icon;
							chk = true;
						}

						// スクリーン名に変更がないか？
						if ( g_cmn.toolbar_user[idx].screen_name != users[user_id].screen_name )
						{
							g_cmn.toolbar_user[idx].screen_name = users[user_id].screen_name;
							chk = true;
						}

						// 変更があったら日付を更新
						if ( chk )
						{
							updflg = true;
							g_cmn.toolbar_user[idx].created_at = users[user_id].created_at;
						}
					}
				}
			}
		}

		if ( updflg )
		{
			UpdateToolbarUser();
		}
*/
	};

	////////////////////////////////////////////////////
	// 宛先を抽出してツイートパネルにセット
	////////////////////////////////////////////////////
	var ExtractReplyUser = function( item ) {
		var text = item.find( '.tweet' ).find( '.tweet_text' ).text();

		var users = text.match( /@[0-9a-zA-Z_]+/g );

		if ( users == null )
		{
			users = new Array();
		}

		var pid = IsUnique( 'tweetbox' );

		var SetRep = function() {
			for ( var i = users.length - 1; i >= 0 ; i-- )
			{
				var screen_name = users[i].replace( /^@/, '' );

				// 自分は除外
				if ( screen_name == g_cmn.account[cp.param['account_id']].screen_name )
				{
					continue;
				}

				// このツイートのユーザーも除外
				if ( screen_name == item.attr( 'screen_name' ) )
				{
					continue;
				}

				$( '#' + pid ).find( 'div.contents' ).trigger( 'userset', [screen_name] );
			}
		};

		// ツイートパネルが開いていない場合は開く
		if ( pid == null )
		{
			var _cp = new CPanel( null, null, 324, 240 );
			_cp.SetType( 'tweetbox' );
			_cp.SetTitle( i18nGetMessage( 'i18n_0083' ), false );
			_cp.SetParam( { account_id: cp.param['account_id'], maxlen: 140, } );
			_cp.Start( function() {
				pid = IsUnique( 'tweetbox' );
				SetRep();
				$( '#' + pid ).find( 'div.contents' ).trigger( 'userset', [item.attr( 'screen_name' )] );
			} );
		}
		else
		{
			SetRep();
			$( '#' + pid ).find( 'div.contents' ).trigger( 'userset', [item.attr( 'screen_name' )] );
			GetPanel( pid ).param.account_id = cp.param['account_id'];
			$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );
		}
	};


	////////////////////////////////////////////////////////////
	// 一覧作成
	////////////////////////////////////////////////////////////
	var ListMake = function( count, type ) {
		var param = {};

		switch ( cp.param['timeline_type'] )
		{
			// ホーム
			case 'home':
				param = {
					api: 'timelines/home',
					data: {
						count: count
					}
				};

				break;
			// ローカル
			case 'local':
				param = {
					api: 'timelines/public?local=true',
					data: {
						count: count
					}
				};
			
				break;
			// 連合
			case 'federated':
				param = {
					api: 'timelines/public',
					data: {
						count: count
					}
				};

				break;
		}

		switch ( type )
		{
			// 初期
			case 'init':
				loading = true;
				stream_queue = [];
				status_ids = {};

				break;
			// 更新
			case 'reload':
				loading = true;
				stream_queue = [];
				status_ids = {};

				break;
			// 新着
			case 'new':
				if ( last_status_id == null )
				{
					// 一度も読み込んでいない場合は、初期として扱う
					type = 'init';
					status_ids = {};
				}
				else
				{
					param.data.since_id = last_status_id;
				}
				break;
			// もっと読む
			case 'old':
				param.data.max_id = first_status_id;
				break;
		}

		lines.activity( { color: '#ffffff' } );

		// API呼び出し
		SendRequest(
			{
				action: 'api_call',
				instance: g_cmn.account[cp.param['account_id']].instance,
				access_token: g_cmn.account[cp.param['account_id']].access_token,
				api: param.api,
				param: param.data
			},
			function( res )
			{
console.log( res );
				if ( !res.status )
				{
					var s = '';
					var json = res.json;
					var assign = {};
					var text = '';
					var len;
					var addcnt = 0;
					var users = {};

					len = res.length;

					for ( var i = 0 ; i < len ; i++ )
					{
						var instance = GetInstanceFromAcct( res[i].account.acct, cp.param['account_id'] );
						
						// 既に読み込み済みのツイート/非表示ユーザは無視
						if ( status_ids[res[i].id + '@' + instance] == undefined )
						{
							s += MakeTimeline( res[i], cp.param['account_id'] );
							status_ids[res[i].id + '@' + instance] = true;
							addcnt++;

							if ( users[res[i].account.id + '@' + instance] == undefined )
							{
								users[res[i].account.id + '@' + instance] = {
									avatar: res[i].account.avatar,
									display_name: res[i].account.display_name,
									created_at: res[i].account.created_at,
								};
							}
						}
					}

					if ( len > 0 )
					{
						// 一番古いツイートのID更新
						if ( type == 'init' || type == 'reload' || type == 'old' )
						{
							first_status_id = res[len - 1].id;
						}

						// 一番新しいツイートのID更新
						if ( type == 'init' || type == 'reload' || type == 'new' )
						{
							last_status_id = res[0].id;
						}
					}

					// もっと読む
					var AppendReadmore = function() {
						if ( len > 0 )
						{
							timeline_list.append(
								'<div class="btn img readmore icon-arrow_down tooltip" tooltip="' + i18nGetMessage( 'i18n_0157' ) + '"></div>' );
						}
					};

					UserInfoUpdate( users );

					var items = null;

					switch ( type )
					{
						// 初期、更新
						case 'init':
						case 'reload':
							timeline_list.html( s );
							timeline_list.scrollTop( 0 );

							AppendReadmore();

							badge.hide().html( '' );
							$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( '' );

							items = timeline_list.find( 'div.item' );

							break;
						// 新着
						case 'new':
							if ( addcnt > 0 )
							{
								var _scheight = timeline_list.prop( 'scrollHeight' );
								var _sctop = timeline_list.scrollTop();

								timeline_list.prepend( s );

								// 新着ツイートにスクロールする
								if ( g_cmn.cmn_param['newscroll'] == 1 && _sctop == 0 )
								{
								}
								else
								{
									var scheight = timeline_list.prop( 'scrollHeight' );
									timeline_list.scrollTop( _sctop + ( scheight - _scheight ) );
								}

								timeline_list.find( '> div.item:lt(' + addcnt + ')' ).addClass( 'new' );
								newitems = $( timeline_list.find( '> div.item.new' ).get() );
								items = newitems;

								// 新着件数
								badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
								$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();

								timeline_list.trigger( 'scroll' );

								// "表示最大数を超えている件数
								var itemcnt = StatusIDCount();

								if ( itemcnt - cp.param['max_count'] > 0 )
								{
									// 新着で読み込んだ分だけ削除
									timeline_list.find( '> div.item:gt(' + ( itemcnt - addcnt - 1 ) + ')' ).each( function() {
										delete status_ids[$( this ).attr( 'status_id' ) + '@' + $( this ).attr( 'user_instance' )];
										$( this ).remove();
									} );

									first_status_id = timeline_list.find( '> div.item:last' ).attr( 'status_id' );
								}
							}

							break;
						// もっと読む
						case 'old':
							var itemcnt = timeline_list.find( '> div.item:not(".res")' ).length;

							if ( addcnt > 0 )
							{
								timeline_list.append( s );

								AppendReadmore();
							}

							timeline_list.find( '.readmore:first' ).remove();
							$( '#tooltip' ).hide();

							items = timeline_list.find( '> div.item:not(".res"):gt(' + ( itemcnt - 1 ) + ')' );
							break;
					}
				}
				else
				{
					// もっと読むで404の場合
					if ( type == 'old' && res.status == 404 )
					{
						timeline_list.find( '.readmore:first' ).remove();
						$( '#tooltip' ).hide();
					}
					else
					{
						ApiError( res );
					}
				}

				lines.activity( false );
				loading = false;

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
			}
		);
	};

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		////////////////////////////////////////
		// 最小化/設定切替時のスクロール位置
		// 保存/復元
		////////////////////////////////////////
		cont.on( 'contents_scrollsave', function( e, type ) {
			// 保存
			if ( type == 0 )
			{
				if ( scrollPos == null && scrollHeight == null )
				{
					scrollPos = timeline_list.scrollTop();
					scrollHeight = timeline_list.prop( 'scrollHeight' );
				}
			}
			// 復元
			else
			{
				// タイムラインが表示されている場合のみ
				if ( scrollPos != null && scrollHeight != null && !setting_show )
				{
					if ( scrollHeight != 0 )
					{
						timeline_list.scrollTop( scrollPos + ( timeline_list.prop( 'scrollHeight' ) - scrollHeight ) );
					}

					scrollPos = null;
					scrollHeight = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			timeline_list.height( cont.height() - cont.find( '.panel_btns' ).height() - 1 )
					.trigger( 'scroll' );

			setting.find( '.tlsetting_items' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		////////////////////////////////////////
		// アカウント変更
		////////////////////////////////////////
		cont.on( 'account_change', function( e, account_id ) {
			if ( cp.param['account_id'] == account_id )
			{
			}
			else
			{
				p.find( 'div.titlebar' ).find( '.titlename' ).text( g_cmn.account[account_id].screen_name );
				cp.param['account_id'] = account_id;

				cp.title = cp.title.replace( /(<span class=\"titlename\">).*(<\/span>)/,
					'$1' + g_cmn.account[account_id].screen_name + '$2' );

				// パネルリストの更新"
				$( document ).trigger( 'panellist_changed' );

				// 更新
				lines.find( '.panel_btns' ).find( '.timeline_reload' ).trigger( 'click' );
			}
		} );

		////////////////////////////////////////
		// このパネルを開いたアカウントが
		// 削除された場合
		////////////////////////////////////////
		var AccountAliveCheck = function() {
			if ( g_cmn.account[cp.param['account_id']] == undefined )
			{
				// グループストリームの場合は閉じない
				if ( cp.param['timeline_type'] == 'group' )
				{
					cp.param['account_id'] = '';

					var _id = cp.id.replace( /^panel_/, '' );

					g_cmn.group_panel[_id] = {
						id: _id,
						param: cp.param,
					};

					return true;
				}
				else
				{
					// パネルを閉じる
					p.find( '.close' ).trigger( 'click', [false] );
					return false;
				}
			}

			return true;
		};

		////////////////////////////////////////
		// アカウント情報更新
		////////////////////////////////////////
		cont.on( 'account_update', function() {
			AccountAliveCheck();

			// アカウント選択リスト更新
			var s = '';
			var id;

			for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
			{
				id = g_cmn.account_order[i];
				s += '<span account_id="' + id + '">' + g_cmn.account[id].screen_name + '</span>';
			}

			p.find( 'div.titlebar' ).find( '.titlename_list' ).html( s )
				.find( 'span' ).click( function( e ) {
					p.find( 'div.contents' ).trigger( 'account_change', [$( this ).attr( 'account_id' )] );
					$( this ).parent().hide();
				} );

			// グループ設定のアカウント一覧を更新
			if ( cp.param['timeline_type'] == 'group' )
			{
				var cur_sel = '';
				var acclist = setting.find( '.acclist' );

				acclist.find( 'div.selected' ).each( function() {
					cur_sel = $( this ).attr( 'account_id' );
				} );

				acclist.html( '' );

				var account_id;

				for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
				{
					account_id = g_cmn.account_order[i];

					acclist.append( OutputTPL( 'tlsetting_accsel', { item: g_cmn.account[account_id], account_id: account_id } ) );

					if ( account_id == cur_sel )
					{
						acclist.find( 'div:last' ).addClass( 'selected' );
					}
				}

				acclist.find( 'div' ).on( 'click', function( e ) {
					acclist.find( 'div' ).removeClass( 'selected' );
					$( this ).addClass( 'selected' );

					if ( $( this ).attr( 'account_id' ) != cp.param['account_id'] )
					{
						setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
					}
				} );
			}
		} );

		////////////////////////////////////////
		// 設定切り替え
		////////////////////////////////////////
		cont.on( 'setting_change', function( e, flg ) {
			setting_show = flg;
		} );

		if ( !AccountAliveCheck() )
		{
			return;
		}

		// 未設定のパラメータに共通パラメータを設定
		if ( cp.param['reload_time'] == undefined )
		{
			cp.param['reload_time'] = g_cmn.cmn_param['reload_time'];
		}

		if ( cp.param['get_count'] == undefined )
		{
			cp.param['get_count'] = g_cmn.cmn_param['get_count'];
		}

		if ( cp.param['max_count'] == undefined )
		{
			cp.param['max_count'] = g_cmn.cmn_param['max_count'];
		}

		if ( cp.param['notify_new'] == undefined )
		{
			cp.param['notify_new'] = g_cmn.cmn_param['notify_new'];
		}

		if ( cp.param['search_lang'] == undefined )
		{
			cp.param['search_lang'] = g_cmn.cmn_param['search_lang'];
		}

		// 全体を作成
		cont.addClass( 'timeline' );
		lines.html( OutputTPL( 'timeline', { type: cp.param['timeline_type'] } ) );

		setting.html( OutputTPL( 'tlsetting', { param: cp.param, uniqueID: GetUniqueID() } ) );

		// タイムラインを表示
		lines.show();
		setting.hide();
		setting_show = false;

		// 設定画面初期化
		SettingInit();

		timeline_list = lines.find( '.timeline_list' );

		// タイトル&ボタン設定
		var account = g_cmn.account[cp.param['account_id']];

		switch ( cp.param['timeline_type'] )
		{
			case 'home':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0152' ) + ' (' + account.display_name + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-home' );
				break;
			case 'local':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0365' ) + ' (' + account.display_name + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-users' );
				break;
			case 'federated':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0366' ) + ' (' + account.display_name + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-earth' );
				break;
		}

		// タイトルバーに新着件数表示用のバッジを追加
		badge = p.find( 'div.titlebar' ).find( '.badge' );

		////////////////////////////////////////
		// バッジクリック処理
		////////////////////////////////////////
		badge.click( function( e ) {
			// 最小化しているとき、設定画面を表示しているときは無視
			if ( cp.minimum.minimum == true )
			{
				return;
			}

			if ( setting_show )
			{
				return;
			}

			var lastitem = $( newitems[newitems.length - 1] );
			timeline_list.scrollTop( timeline_list.scrollTop() +
				lastitem.position().top - timeline_list.position().top );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		// TLの流速を表示
		////////////////////////////////////////
		p.find( '.titleicon' ).mouseenter( function( e ) {
			var spd;
			var unit = chrome.i18n.getMessage( 'i18n_0270' );

			var itemcnt = StatusIDCount();

			if ( itemcnt < 1 )
			{
				spd = '--';
				unit = '--';
			}
			else
			{
				//var firstdate = Date.parse( timeline_list.find( '> item:first' ).attr( 'created_at' ).replace( '+', 'GMT+' ) );
				var firstdate = new Date();
				var lastdate = Date.parse( timeline_list.find( '> div.item:last' ).attr( 'created_at' ).replace( '+', 'GMT+' ) );

				spd = itemcnt / ( firstdate - lastdate ) * 1000;

				if ( spd < 0 )
				{
					spd = '--';
					unit = '--';
				}
				else
				{
					// 分速
					if ( spd < 1 )
					{
						spd = spd * 60;
						unit = chrome.i18n.getMessage( 'i18n_0272' );
					}

					// 時速
					if ( spd < 1 )
					{
						spd = spd * 60;
						unit = chrome.i18n.getMessage( 'i18n_0299' );
					}

					// 日速
					if ( spd < 1 )
					{
						spd = spd * 24;
						unit = chrome.i18n.getMessage( 'i18n_0259' );
					}

					// 月速
					if ( spd < 1 )
					{
						spd = spd * 30.41667;
						unit = chrome.i18n.getMessage( 'i18n_0203' );
					}

					// 年速
					if ( spd < 1 )
					{
						spd = spd * 12;
						unit = chrome.i18n.getMessage( 'i18n_0264' );
					}

					spd = Math.floor( spd * 100 ) / 100;
				}
			}

			$( this ).attr( 'tooltip', chrome.i18n.getMessage( 'i18n_0037' ) + ': ' + spd + '/' + unit );
		} );

		////////////////////////////////////////
		// 新着読み込みタイマー開始
		////////////////////////////////////////
		timeline_list.on( 'reload_timer', function() {
			// タイマーを止める
			if ( tm != null )
			{
				clearInterval( tm );
				tm = null;
			}

			// グループストリームの場合はタイマー起動しない
			if ( cp.param['timeline_type'] == 'group' )
			{
				lines.find( '.streamuse' ).css( { display: 'none' } );

				if ( cp.param['account_id'] )
				{
					if ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 )
					{
						lines.find( '.streamuse' ).css( { display: 'inline-block' } );
					}
				}

				return;
			}

			// ユーザーストリームを使うTL
			var tl_stream = ( cp.param['timeline_type'] == 'home' ||
							  cp.param['timeline_type'] == 'mention' ||
							  cp.param['timeline_type'] == 'dmrecv' ||
							  cp.param['timeline_type'] == 'dmsent' );

			// 自動更新なしTL
			var tl_noreload = ( cp.param['timeline_type'] == 'favorites' || cp.param['timeline_type'] == 'perma' );

			// タイマー起動
			if ( ( g_cmn.account[cp.param['account_id']].notsave.stream != 2 && !tl_noreload ) ||
				 ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 && !tl_stream && !tl_noreload ) )
			{
				tm = setInterval( function() {
					ListMake( cp.param['get_count'], 'new' );
				}, cp.param['reload_time'] * 1000 );
			}

			// stream表示
			if ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 &&
				( cp.param['timeline_type'] == 'home' ||
				  cp.param['timeline_type'] == 'mention' ||
				  cp.param['timeline_type'] == 'dmrecv' ||
				  cp.param['timeline_type'] == 'dmsent' ) )
			{
				lines.find( '.streamuse' ).css( { display: 'inline-block' } );
			}
			else
			{
				lines.find( '.streamuse' ).css( { display: 'none' } );
			}
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.timeline_reload' ).click( function() {
			lines.find( '.panel_btns' ).find( '.streamuse' ).removeClass( 'reconnect tooltip' ).attr( 'tooltip', '' );

			timeline_list.trigger( 'reload_timer' );
			ListMake( cp.param['get_count'], 'reload' );
		} );

		////////////////////////////////////////
		// クリアボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.timeline_clear' ).click( function() {
			lines.find( '.panel_btns' ).find( '.streamuse' ).removeClass( 'reconnect tooltip' ).attr( 'tooltip', '' );

			status_ids = {};
			timeline_list.html( '' );
			timeline_list.scrollTop( 0 );

			badge.hide().html( '' );
			$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( '' );
		} );

		////////////////////////////////////////
		// 一番上へ
		////////////////////////////////////////
		lines.find( '.sctbl' ).find( 'a:first' ).click( function( e ) {
			timeline_list.scrollTop( 0 );
		} );

		////////////////////////////////////////
		// 一番下へ
		////////////////////////////////////////
		lines.find( '.sctbl' ).find( 'a:last' ).click( function( e ) {
			timeline_list.scrollTop( timeline_list.prop( 'scrollHeight' ) );
		} );

		////////////////////////////////////////
		// 引用
		////////////////////////////////////////
		var QuoteText = function( item ) {
			var url = item.find( 'span.date > a' ).attr( 'href' );

			var pid = IsUnique( 'tweetbox' );

			var SetText = function() {
				$( '#tweetbox_text' ).val( $( '#tweetbox_text' ).val() + ' ' + url )
					.focus()
					.trigger( 'keyup' )
					.SetPos( 'end' );
			};

			// ツイートパネルが開いていない場合は開く
			if ( pid == null )
			{
				var _cp = new CPanel( null, null, 324, 240 );
				_cp.SetType( 'tweetbox' );
				_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0083' ), false );
				_cp.SetParam( { account_id: cp.param['account_id'], maxlen: 140, } );
				_cp.Start( function() {
					SetText();
				} );
			}
			else
			{
				SetText();

				var _cp = GetPanel( pid );
				_cp.param.account_id = cp.param['account_id'];
				$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );
			}
		}

		////////////////////////////////////////
		// DMを書く
		////////////////////////////////////////
		var DMWrite = function( item ) {
			var screen_name = item.attr( 'screen_name' );

			// パネルのパラメータ
			var param = {
				account_id: cp.param['account_id'],
				screen_name: screen_name,
				maxlen: g_cmn.twconfig['dm_text_character_limit'],
/*				maxlen: 140,*/
			};

			var pid = IsUnique( 'dmbox' );
			var left = null;
			var top = null;
			var width = 324;

			// DMパネルが開いている場合は閉じる
			if ( pid != null )
			{
				// 位置とサイズを保存
				$( '#' + pid ).each( function() {
					left = $( this ).position().left;
					top = $( this ).position().top;
					width = $( this ).width();
				} );

				$( '#' + pid ).find( '.close' ).trigger( 'click', [false] );
			}

			var _cp = new CPanel( left, top, width, 200 );
			_cp.SetType( 'dmbox' );
			_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0149', [screen_name] ), false );
			_cp.SetParam( param );
			_cp.Start();
		};

		////////////////////////////////////////
		// リツイート
		////////////////////////////////////////
		var Retweet = function( item, account_id ) {
			if ( g_cmn.cmn_param['confirm_rt'] == 0 || confirm( chrome.i18n.getMessage( 'i18n_0175' ) ) )
			{
				var param = {
					type: 'POST',
					url: ApiUrl( '1.1' ) + 'statuses/retweet/' + item.attr( 'status_id' ) + '.json',
					data: {},
				};

				Blackout( true, false );
				$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

				SendRequest(
					{
						action: 'oauth_send',
						acsToken: g_cmn.account[account_id]['accessToken'],
						acsSecret: g_cmn.account[account_id]['accessSecret'],
						param: param,
						id: account_id
					},
					function( res )
					{
						if ( res.status == 200 )
						{
							// リツイート表示を埋め込む
							if ( item.find( '.retweet' ).length == 0 )
							{
								item.find( '.icon' ).append( "<div class='retweet tooltip' tooltip='" +
										chrome.i18n.getMessage( 'i18n_0013', [g_cmn.account[account_id]['screen_name']] ) +
										"' rt_user_id='" + g_cmn.account[account_id]['user_id'] + "' rt_screen_name='" + g_cmn.account[account_id]['screen_name'] + "'>" +
										"<img src='" + g_cmn.account[account_id]['icon'] + "' class='rt_icon'></div>" )
									.css( { width: g_cmn.cmn_param['iconsize'] } )
									.find( '> img' ).css( { width: g_cmn.cmn_param['iconsize'], height: g_cmn.cmn_param['iconsize'] } )
									.end()
									.find( '.retweet img' ).css( { width: g_cmn.cmn_param['iconsize'] * 0.7, height: g_cmn.cmn_param['iconsize'] * 0.7 } );

							}

							// ツイート数表示の更新
							StatusesCountUpdate( account_id, 1 );
						}
						else
						{
							ApiError( chrome.i18n.getMessage( 'i18n_0177' ), res );
						}

						Blackout( false, false );
						$( '#blackout' ).activity( false );
					}
				);
			}
		};

		////////////////////////////////////////
		// クリックイベント
		////////////////////////////////////////
		timeline_list.click( function( e ) {
			var targ = $( e.target );
			var ptarg = targ.parent();

			////////////////////////////////////////
			// ユーザ名クリック
			////////////////////////////////////////
			if ( targ.hasClass( 'name' ) )
			{
				OpenUserTimeline( targ.parent().find( '.screen_name' ).text(), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// スクリーン名クリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'screen_name' ) )
			{
				OpenUserTimeline( targ.parent().find( '.screen_name' ).text(), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// アイコンクリック
			////////////////////////////////////////
			else if ( ptarg.hasClass( 'icon' ) )
			{
				var user_id = ptarg.parent().attr( 'user_id' );

				OpenUserShow( ptarg.parent().attr( 'screen_name' ),
					user_id,
					cp.param['account_id'] );
			}
			////////////////////////////////////////
			// RTユーザアイコンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'rt_icon' ) )
			{
				OpenUserShow( targ.parent().attr( 'rt_screen_name' ), targ.parent().attr( 'rt_user_id' ), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// リンククリック処理
			////////////////////////////////////////
			else if ( ptarg.hasClass( 'tweet_text' ) )
			{
				if ( targ.hasClass( 'anchor' ) )
				{
					if ( targ.hasClass( 'url' ) )
					{
						var url = targ.attr( 'href' );

						// ツイートへのパーマリンク
						if ( url.match( /^https?:\/\/(mobile\.)*twitter\.com\/(#!\/)?(\w+)\/status(es)?\/(\d+)(\?.+)?$/ ) )
						{
							var screen_name = RegExp.$3;
							var status_id = RegExp.$5;

							var _cp = new CPanel( null, null, 360, 240 );
							_cp.SetType( 'timeline' );
							_cp.SetParam( {
								account_id: cp.param['account_id'],
								timeline_type: 'perma',
								screen_name: screen_name,
								status_id: status_id,
								reload_time: g_cmn.cmn_param['reload_time'],
							} );
							_cp.Start();

							return false;
						}

						window.open( url, '_blank' );
						return false;
					}

					if ( targ.hasClass( 'user' ) )
					{
						OpenUserTimeline( targ.text().replace( /^@/, '' ), cp.param['account_id'] );
					}

					if ( targ.hasClass( 'hashtag' ) )
					{
						OpenSearchResult( targ.text(), cp.param['account_id'] );
					}
				}
			}
			////////////////////////////////////////
			// 返信ボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_reply' ) )
			{
				var item = targ.parent().parent().parent().parent();

				// DMの返信
				if ( cp.param['timeline_type'] == 'dmrecv' )
				{
					DMWrite( item );

					e.stopPropagation();
					return;
				}

				// 返信ツイート情報
				var reply = {
					status_id: ( item.attr( 'rt_id' ) ) ? item.attr( 'rt_id' ) : item.attr( 'status_id' ),
					icon: item.find( '.icon' ).find( 'img' ).attr( 'src' ),
					screen_name: item.attr( 'screen_name' ),
					date: item.find( '.date' ).text(),
					status: escapeHTML( item.find( '.tweet' ).find( '.tweet_text' ).text() ),
				};

				// 返信ツイート＆宛先設定処理
				var SetParameters = function() {
					$( '#' + pid ).find( 'div.contents' ).trigger( 'repset', [reply] );

					GetPanel( pid ).param.account_id = cp.param['account_id'];
					$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );

					// 本文中のユーザーを宛先に設定する
					ExtractReplyUser( item );

					SetFront( $( '#' + pid ) );
				}

				var pid = IsUnique( 'tweetbox' );

				if ( pid == null )
				{
					// パネルのパラメータ
					var param = {
						account_id: cp.param['account_id'],
						maxlen: 140,
					};

					var _cp = new CPanel( null, null, 324, 240 );
					_cp.SetType( 'tweetbox' );
					_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0083' ), false );
					_cp.SetParam( param );
					_cp.Start( function() {
						pid = IsUnique( 'tweetbox' );
						SetParameters();
					} );
				}
				else
				{
					SetParameters();
				}
			}
			////////////////////////////////////////
			// メニューボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_menu' ) )
			{
				// disabledなら処理しない
				if ( targ.hasClass( 'disabled' ) )
				{
					return;
				}

				var item = targ.parent().parent().parent().parent();

				// 最初にクリックされたときにメニューボックス部を作成
				if ( item.find( '.menubox' ).length == 0 )
				{
					item.find( '.tweet' ).append( OutputTPL( 'timeline_menu', {
						protected: item.attr( 'protected' ),
						toolbaruser: ( IsToolbarUser( item.attr( 'user_id' ) ) != -1 ) ? true : false,
					} ) );

					var menubox = item.find( 'div.tweet' ).find( 'div.menubox' );

					// ツールバーに登録ボタンクリック処理
					menubox.find( '> a.toolbaruser' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						// ツールバーから削除
						if ( $( this ).attr( 'toolbaruser' ) == 'true' )
						{
							var len = g_cmn.toolbar_user.length;

							for ( var i = 0 ; i < len ; i++ )
							{
								if ( g_cmn.toolbar_user[i].screen_name == item.attr( 'screen_name' ) && g_cmn.toolbar_user[i].type == 'user' )
								{
									g_cmn.toolbar_user.splice( i, 1 );
									break;
								}
							}

							$( this ).attr( 'toolbaruser', false ).html( chrome.i18n.getMessage( 'i18n_0092' )  );

							UpdateToolbarUser();
						}
						// ツールバーに登録
						else
						{
							if ( IsToolbarUser( item.attr( 'user_id' ) ) == -1 )
							{
								g_cmn.toolbar_user.push( {
									type: 'user',
									user_id: item.attr( 'user_id' ),
									screen_name: item.attr( 'screen_name' ),
									icon: item.find( '.icon img' ).attr( 'src' ),
									account_id: cp.param['account_id'],
									created_at: item.attr( 'created_at' ),
								} );
							}

							$( this ).attr( 'toolbaruser', true ).html( chrome.i18n.getMessage( 'i18n_0091' ) );

							UpdateToolbarUser();
						}

						e.stopPropagation();
					} );
				}

				item.find( '.menubox' ).toggle();
			}
			////////////////////////////////////////
			// RTボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_retweet' ) )
			{
				// disabledなら処理しない
				if ( targ.hasClass( 'disabled' ) )
				{
					return;
				}

				var item = targ.parent().parent().parent().parent();

				// Ctrl+RTボタンで引用
				if ( e.ctrlKey )
				{
					QuoteText( item );
				}
				else
				{
					if ( AccountCount() > 1 && g_cmn.cmn_param['rt_accsel'] == 1 )
					{
						var s = '';
						var accsel = item.find( '.accsel' );

						accsel.html( '' );

						var account_id;

						for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
						{
							account_id = g_cmn.account_order[i];
							accsel.append( OutputTPL( 'timeline_accsel', { item: g_cmn.account[account_id], account_id: account_id } ) );
						}

						accsel.find( 'img' ).click( function( e ) {
							Retweet( item, $( this ).attr( 'account_id' ) );
							$( this ).parent().toggle();
						} );

						accsel.toggle();
						return;
					}
					else
					{
						Retweet( item, cp.param['account_id'] );
					}
				}
			}
			////////////////////////////////////////
			// 削除ボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_del' ) )
			{
				var item = targ.parent().parent().parent().parent();

				if ( confirm( chrome.i18n.getMessage( 'i18n_0224' ) ) )
				{
					// DM以外
					if ( cp.param['timeline_type'] != 'dmrecv' && cp.param['timeline_type'] != 'dmsent' )
					{
						var param = {
							type: 'POST',
							url: ApiUrl( '1.1' ) + 'statuses/destroy/' + item.attr( 'status_id' ) + '.json',
							data: {},
						};
					}
					// DM
					else
					{
						var param = {
							type: 'POST',
							url: ApiUrl( '1.1' ) + 'direct_messages/destroy.json',
							data: {
								id: item.attr( 'status_id' )
							},
						};
					}

					Blackout( true );
					$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

					SendRequest(
						{
							action: 'oauth_send',
							acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
							acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
							param: param,
							id: cp.param['account_id']
						},
						function( res )
						{
							if ( res.status == 200 )
							{
								// タイムラインから削除
								item.fadeOut( 'fast', function() {
									// 返信元の表示を消す
									while ( 1 )
									{
										var next = item.next();

										if ( next.hasClass( 'res' ) )
										{
											next.remove();
										}
										else
										{
											break;
										}
									}

									delete status_ids[$( this ).attr( 'status_id' )];
									$( this ).remove();

									if ( cp.param['timeline_type'] != 'dmrecv' && cp.param['timeline_type'] != 'dmsent' )
									{
										// ツイート数表示の更新
										StatusesCountUpdate( cp.param['account_id'], 1 );
									}
								} );
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0225' ), res );
							}

							Blackout( false );
							$( '#blackout' ).activity( false );
						}
					);
				}
			}
			////////////////////////////////////////
			// ☆クリック処理
			////////////////////////////////////////
			else if ( targ.hasClass( 'fav' ) )
			{
				var item = targ.parent().parent().parent().parent();

				// on→off
				if ( targ.hasClass( 'on' ) )
				{
					var param = {
						type: 'POST',
						url: ApiUrl( '1.1' ) + 'favorites/destroy.json',
						data: {
							id: item.attr( 'status_id' )
						},
					};

					Blackout( true, false );
					$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

					SendRequest(
						{
							action: 'oauth_send',
							acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
							acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
							param: param,
							id: cp.param['account_id']
						},
						function( res )
						{
							if ( res.status == 200 )
							{
								targ.removeClass( 'on' ).addClass( 'off' );
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0225' ), res );
							}

							Blackout( false, false );
							$( '#blackout' ).activity( false );
						}
					);
				}
				// off→on
				else
				{
					// animate
					var _star = targ.clone();

					$( '#main' ).append( _star );

					targ.css( {
						visibility: 'hidden',
					} );

					_star.css( {
						position: 'absolute',
						left: targ.offset().left,
						top: targ.offset().top,
						zIndex: targ.zIndex() + 1,
						fontSize: '1.3rem',
						color: '#a4a396'
					} );

					var _mag = 4;

					_star.animate(
						{
							fontSize: targ.outerWidth() * _mag + 'px',
							left: targ.offset().left - targ.outerWidth() * ( _mag - 1 ) / 2 + 'px',
							top: targ.offset().top - targ.outerHeight() * ( _mag - 1 ) / 2 + 'px',
							opacity: 0.2,
							color: '#dd2e44'
						},
						300,
						function() {
							targ.css( {
								visibility: 'visible'
							} )

							_star.remove();
						}
					);

					var param = {
						type: 'POST',
						url: ApiUrl( '1.1' ) + 'favorites/create.json',
						data: {
							id: item.attr( 'status_id' )
						},
					};

					Blackout( true, false );
					$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

					SendRequest(
						{
							action: 'oauth_send',
							acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
							acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
							param: param,
							id: cp.param['account_id']
						},
						function( res )
						{
							if ( res.status == 200 )
							{
								targ.removeClass( 'off' ).addClass( 'on' );
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0057' ), res );
							}

							Blackout( false, false );
							$( '#blackout' ).activity( false );
						}
					);
				}
			}
			else
			{
				return;
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// RTアイコン右クリック
		////////////////////////////////////////
		timeline_list.on( 'contextmenu', $( '> div.item' ).find( 'div.icon' ).find( 'img.rt_icon' ).selector, function( e ) {
			OpenUserTimeline( $( this ).parent().attr( 'rt_screen_name' ), cp.param['account_id'] );

			return false;
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', $( '> div.item' ).find( 'div.icon' ).find( '> img' ).selector, function( e ) {
			if ( e.type == 'mouseenter' )
			{
				// Draggableの設定をする
				if ( !$( this ).hasClass( 'ui-draggable' ) )
				{
					SetDraggable( $( this ), p, cp );
				}
			}
			else
			{
				$( '#tooltip' ).hide();
			}
		} );

		////////////////////////////////////////
		// リンクにカーソルを乗せたとき
		////////////////////////////////////////
		var onURL = false;

		timeline_list.on( 'mouseenter mouseleave', $( '> div.item' ).find( 'div.tweet_text' ).find( 'a.anchor.url' ).selector, function( e, noloading, stream ) {
			var anchor = $( this );
			var item = anchor.parent().parent().parent();
			var url = anchor.attr( 'href' );

			if ( e.type == 'mouseenter' )
			{
				onURL = true;

				setTimeout( function() {
					if ( onURL == false )
					{
						return;
					}

					// 短縮URLの場合、URL展開を行う
					if ( isShortURL( url ) && g_cmn.cmn_param['urlexpand'] == 1 )
					{
						anchor.removeClass( 'anchor' )
							.addClass( 'expand' )
							.removeAttr( 'href' );

						if ( !noloading )
						{
							item.find( '.tweet' ).activity( { color: '#ffffff' } );
						}

						var org = url;

						// URL展開
						SendRequest(
							{
								action: 'url_expand',
								url: url,
							},
							function( res )
							{
								var durl;

								try {
									durl = escapeHTML( decodeURI( res ) );
								}
								catch ( e )
								{
									console.log( 'decode error [' + res + ']' );
									durl = res;
								}

								if ( res != '' )
								{
									anchor.attr( 'href', res );
									anchor.html( res );
								}
								else
								{
									anchor.attr( 'href', org );
									anchor.html( org );
								}

								anchor.removeClass( 'expand' )
									.addClass( 'anchor' );

								if ( !noloading )
								{
									item.find( '.tweet' ).activity( false );
								}
							}
						);
					}
					else if ( g_cmn.cmn_param['thumbnail'] )
					{
						var add = item.find( '.additional' );
						var id;

						if ( add.length == 0 )
						{
							item.find( '.tweet' ).append( "<div class='bottomcontainer'><div class='additional'></div></div>" );
							add = item.find( '.additional' );
						}

						////////////////////////////////////////
						// サムネイル表示＆
						// 原寸サイズ表示処理作成
						////////////////////////////////////////
						var MakeImgLink = function( thumb, original, mov, img_count, isvideo, contenttype ) {
							if ( add.find( 'img[loaded="' + url + '"]' ).length < img_count )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								add.append( OutputTPL( ( mov ) ? 'thumbnail_movie' : 'thumbnail', {
									url: thumb,
									tooltip: url
								} ) );

								// ロード失敗
								add.find( 'img:last-child' ).error( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}
									$( this ).remove();
								} );

								// ロード成功
								add.find( 'img:last-child' ).load( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}

									if ( original != '' )
									{
										if ( mov )
										{
											$( this ).addClass( 'link' );

											$( this ).click( function( e ) {
												chrome.tabs.create( { url: original }, function( tab ) {
												} );

												e.stopPropagation();
											} );
										}
										else
										{
											$( this ).addClass( 'link' );

											$( this ).click( function( e ) {
												var _cp = new CPanel( null, null, 320, 320 );
												_cp.SetType( 'image' );
												_cp.SetParam( {
													url: original,
													video: isvideo,
													contenttype: contenttype,
												} );
												_cp.Start();

												e.stopPropagation();
											} );
										}
									}
									else
									{
										$( this ).removeClass( 'tooltip' );
									}
								} );
							}
						};

						// twitpic
						if ( url.match( /^http:\/\/twitpic\.com\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://twitpic.com/show/mini/' + id,
										 'http://twitpic.com/show/full/' + id,
										 false, 1 );
						}
						// ow.ly/i
						else if ( url.match( /^http:\/\/ow\.ly\/i\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://static.ow.ly/photos/thumb/' + id + '.jpg',
										 'http://static.ow.ly/photos/original/' + id + '.jpg',
										 false, 1 );
						}
						// yfrog
						else if ( url.match( /^http:\/\/yfrog\.com\/(\w+)/ ) )
						{
							id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'yfrog_url',
										imgid: id,
									},
									function( res )
									{
										MakeImgLink( 'http://yfrog.com/' + id + ':small', res, false, 1 );

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// tweetphoto/plixi
						else if ( url.match( /^(http:\/\/tweetphoto\.com\/\d+)/ ) ||
								  url.match( /^(http:\/\/plixi\.com\/p\/\d+)/ ) ||
								  url.match( /^(http:\/\/lockerz\.com\/s\/\d+)/ ) )
						{
							var purl = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'plixi_url',
										imgurl: purl,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// twipple
						else if ( url.match( /http:\/\/p\.twipple\.jp\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://p.twipple.jp/show/thumb/' + id,
										 'http://p.twipple.jp/show/orig/' + id, false, 1 );
						}
						// movapic
						else if ( url.match( /http:\/\/movapic\.com\/pic\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://image.movapic.com/pic/t_' + id + '.jpeg',
										 'http://image.movapic.com/pic/m_' + id + '.jpeg', false, 1 );
						}
						// フォト蔵
						else if ( url.match( /http:\/\/photozou\.jp\/photo\/show\/\d+\/(\d+)/ ) )
						{
							id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'photozou_url',
										imgid: id,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// instagram
						else if ( url.match( /https?:\/\/((www\.)?instagram\.com|instagram\.com|instagr\.am)\/p\/([\w\-]+)/ ) )
						{
							id = RegExp.$3;

							MakeImgLink( 'http://instagram.com/p/' + id + '/media/?size=t',
										 'http://instagram.com/p/' + id + '/media/?size=l',
										 false, 1 );
						}
						// 公式
						else if ( url.match( /https?:\/\/twitter\.com.*\/(photo|video)\/1$/ ) )
						{
							if ( anchor.attr( 'mediaurl' ) )
							{
								var mediaurls = anchor.attr( 'mediaurl' ).split( ',' );
								var videourls = anchor.attr( 'videourl' ).split( ',' );
								var contenttypes = anchor.attr( 'contenttype' ).split( ',' );

								for ( var i = 0, _len = mediaurls.length ; i < _len ; i++ )
								{
									if ( videourls[i] == '' )
									{
										MakeImgLink( mediaurls[i] + ':thumb',
													 mediaurls[i] + ':orig', false, mediaurls.length );
									}
									else
									{
										MakeImgLink( mediaurls[i],
													 videourls[i], false, mediaurls.length, true, contenttypes[i] );
									}
								}
							}
						}
						// 公式(DM)
						else if ( url.match( /https?:\/\/twitter\.com.*\/messages\/media\/\d+$/ ) )
						{
							if ( anchor.attr( 'mediaurl' ) )
							{
								var mediaurls = anchor.attr( 'mediaurl' ).split( ',' );

								for ( var i = 0, _len = mediaurls.length ; i < _len ; i++ )
								{
									MakeImgLink( mediaurls[i] + ':thumb',
												 mediaurls[i], false, mediaurls.length );
								}
							}
						}
						// youtube
						else if ( url.match( /^https?:\/\/(?:(?:www|m)\.youtube\.com\/watch\?.*v=|youtu\.be\/)([\w-]+)/ ) )
						{
							var id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								add.append( OutputTPL( 'thumbnail_movie', {
									url: 'http://i.ytimg.com/vi/' + id + '/default.jpg',
									tooltip: url
								} ) );

								// ロード失敗
								add.find( 'img:last-child' ).error( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}
									$( this ).remove();
								} );

								// ロード成功
								add.find( 'img:last-child' ).load( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}

									$( this ).addClass( 'link' );

									$( this ).click( function( e ) {
										var _cp = new CPanel( null, null, 480, 360 );
										_cp.SetType( 'youtube' );
										_cp.SetParam( {
											url: url,
										} );
										_cp.Start();

										e.stopPropagation();
									} );
								} );
							}
						}
						// Vine
						else if ( url.match( /^https?:\/\/vine\.co\/v\/(\w+)/ ) )
						{
							var id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'vine_url',
										imgurl: url,
									},
									function( res )
									{
										if ( res != '' )
										{
											add.append( OutputTPL( 'thumbnail_movie', {
												url: res.thumb,
												tooltip: url
											} ) );
										}

										// ロード失敗
										add.find( 'img:last-child' ).error( function( e ) {
											if ( !noloading )
											{
												item.find( '.tweet' ).activity( false );
											}
											$( this ).remove();
										} );

										// ロード成功
										add.find( 'img:last-child' ).load( function( e ) {
											if ( !noloading )
											{
												item.find( '.tweet' ).activity( false );
											}

											$( this ).addClass( 'link' );

											$( this ).click( function( e ) {
												var _cp = new CPanel( null, null, 480, 510 );
												_cp.SetType( 'vine' );
												_cp.SetParam( {
													url: url,
													screen_name: item.attr( 'screen_name' ),
												} );
												_cp.Start();

												e.stopPropagation();
											} );
										} );
									}
								);
							}
						}
						// TINAMI
						else if ( url.match( /http:\/\/tinami\.jp\/(\w+)$/ ) )
						{
							id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'tinami_url',
										imgid: id,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// ニコニコ動画
						else if ( url.match( /http:\/\/(www\.nicovideo\.jp\/watch|nico\.ms)\/sm(\d+)(\?.+)?$/ ) )
						{
							id = RegExp.$2;

							MakeImgLink( 'http://tn-skr' + ( parseInt( id ) % 4 + 1 ) + '.smilevideo.jp/smile?i=' + id, '', true, 1 );
						}
						// img.ly
						else if ( url.match( /^http:\/\/img\.ly\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://img.ly/show/thumb/' + id,
										 'http://img.ly/show/full/' + id,
										 false, 1 );
						}
						// Streamスクリーンショット
						else if ( url.match( /(http:\/\/cloud(-\d)?\.steampowered\.com\/ugc\/\d+\/\w+\/)(\d+x\d+\.resizedimage)?$/ ) )
						{
							MakeImgLink( RegExp.$1 + '150x150.resizedimage', url, false, 1 );
						}
						// gyazo
						else if ( url.match( /https?:\/\/gyazo\.com\/\w+$/ ) )
						{
							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'gyazo_url',
										imgurl: url,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// 画像直リンク
						else if ( url.match( /https?:\/\/.*\.(png|jpg|jpeg|gif)$/i ) )
						{
							MakeImgLink( url, url, false, 1 );
						}
					}
				}, 100 );
			}
			else
			{
				onURL = false;
				$( '#tooltip' ).hide();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// カーソルを乗せたとき（ボタン群表示）
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', $( '> div.item' ).selector, function( e ) {
			var options = $( this ).find( 'div.options' );

			if ( e.type == 'mouseenter' )
			{
				timeline_list.find( '> div.items' ).find( 'div.options' ).find( 'span.btns' ).css( { display: 'none' } );

				// 初めて乗せたときに描画
				if ( options.find( 'span.btns' ).length == 0 )
				{
					options.prepend( OutputTPL( 'timeline_options', {
						mytweet: options.attr( 'mytweet' ),
						protected: options.attr( 'protected' ),
						type: cp.param['timeline_type'],
					} ) );
				}

				// ボタンにカーソルを乗せたときの処理
				options.find( 'span.btns, span.fav' ).on( 'mouseenter mouseleave', function( e ) {
					if ( e.type == 'mouseenter' )
					{
						cursor_on_option = true;
					}
					else
					{
						cursor_on_option = false;
					}

					e.stopPropagation();
				} )
				.css( { display: 'inline-block' } );
			}
			else
			{
				options.find( 'span.btns, span.fav.off' ).css( { display: 'none' } );
				$( '#tooltip' ).hide();
			}

			$( this ).find( 'div.accsel' ).hide();
		} );

		////////////////////////////////////////
		// スクロール抑止
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', $( '> div.item div.options span' ).selector, function( e ) {
			if ( e.type == 'mouseenter' )
			{
				cursor_on_option = true;
			}
			else
			{
				cursor_on_option = false;
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// もっと読むクリック処理
		////////////////////////////////////////
		timeline_list.on( 'click', $( '> div.readmore' ).selector, function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			$( this ).addClass( 'disabled' );

			ListMake( cp.param['get_count'], 'old' );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// スクロール処理
		////////////////////////////////////////
		timeline_list.scroll( function( e ) {
			// 最小化しているとき、設定画面を表示しているときは無視
			if ( cp.minimum.minimum == true )
			{
				return;
			}

			if ( setting_show )
			{
				return;
			}

			var _chgcnt = 0;
			var _tlh = timeline_list.height();
			var _tltop = timeline_list.position().top;

			newitems.each( function() {
				var item = $( this );

				var pos = item.position().top - _tltop;

				if ( pos < 0 )
				{
					return true;
				}

				if ( pos > _tlh )
				{
					return false;
				}

				item.removeClass( 'new' );

				if ( g_cmn.cmn_param['auto_thumb'] )
				{
					OpenThumbnail( item, ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 &&
						( cp.param['timeline_type'] == 'home' || cp.param['timeline_type'] == 'mention' ) ) );
				}

				_chgcnt++;
			} );

			if ( _chgcnt )
			{
				newitems = $( timeline_list.find( 'div.item.new' ).get() );

				if ( newitems.length == 0 )
				{
					badge.hide().html( '' );
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( '' );
				}
				else
				{
					badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
				}
			}
		} );

		ListMake( cp.param['get_count'], 'init' );

		timeline_list.trigger( 'reload_timer' );

		// ホーム/Mention/DM/グループストリームの場合、ユーザーストリームの受け口を用意する
		if ( ( cp.param['timeline_type'] == 'home' ||
			   cp.param['timeline_type'] == 'mention' ||
			   cp.param['timeline_type'] == 'dmrecv' ||
			   cp.param['timeline_type'] == 'dmsent' ||
			   cp.param['timeline_type'] == 'group' ) )
		{
			////////////////////////////////////////
			// ストリームデータ受信処理
			////////////////////////////////////////
			cont.on( 'getstream', function( e, json ) {
				// APIの実行中はキューに保管
				if ( loading == true )
				{
					stream_queue.push( json );
					return;
				}

				var addcnt = 0;
				var tltype;

				if ( cp.param['timeline_type'] == 'dmrecv' )
				{
					tltype = 'dmrecv';
				}
				else if ( cp.param['timeline_type'] == 'dmsent' )
				{
					tltype = 'dmsent';
				}
				else
				{
					tltype = 'normal';
				}

				// グループストリームの場合はメンバーか確認
				var memchk = false;

				if ( cp.param['timeline_type'] == 'group' )
				{
					for ( var id in cp.param['users'] )
					{
						if ( id == json.user.id_str )
						{
							memchk = true;
							break;
						}
					}
				}

				// 引用元付きのときはキャッシュに追加
				AddQuoteCache( json );

				// 既に読み込み済みのツイート/非表示ユーザは無視
				if ( status_ids[json.id_str] == undefined )
				{
					var _sctop = timeline_list.scrollTop();

					if ( cp.param['timeline_type'] == 'home' || cp.param['timeline_type'] == 'mention' || ( cp.param['timeline_type'] == 'group' && memchk == true ) )
					{
						timeline_list.prepend( MakeTimeline( json, cp.param['account_id'] ) ).children( ':first' ).hide().fadeIn();
						//timeline_list.prepend( MakeTimeline( json, cp.param['account_id'] ) );

						// ハッシュタグプルダウンを更新
						if ( json.entities.hashtags.length )
						{
							$( 'div.contents' ).trigger( 'hashtag_pulldown_update' );
						}

						status_ids[json.id_str] = true;

						var users = {};

						users[json.id_str] = {
							icon: json.user.profile_image_url_https,
							screen_name: json.user.screen_name,
							created_at: json.created_at
						};

						UserInfoUpdate( users );
						addcnt++;
					}
					else if ( cp.param['timeline_type'] == 'dmrecv' || cp.param['timeline_type'] == 'dmsent' )
					{
						timeline_list.prepend( MakeTimeline_DM( json, cp.param['timeline_type'], cp.param['account_id'] ) ).children( ':first' ).hide().fadeIn();
						//timeline_list.prepend( MakeTimeline_DM( json, cp.param['timeline_type'], cp.param['account_id'] ) );
						status_ids[json.id_str] = true;
						addcnt++;
					}
				}

				// 一番新しいツイートのID更新
				last_status_id = json.id_str;

				if ( addcnt > 0 )
				{
					// 新着ツイートにスクロールする
					if ( g_cmn.cmn_param['newscroll'] && _sctop == 0 && !cursor_on_option )
					{
					}
					else
					{
						timeline_list.scrollTop( _sctop + ( timeline_list.find( '> div.item:eq(0)' ).outerHeight() ) );
					}

					timeline_list.find( '> div.item:lt(1)' ).addClass( 'new' );
					newitems = $( timeline_list.find( '> div.item.new' ).get() );

					badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					timeline_list.trigger( 'scroll' );

					// 表示最大数を超えている件数
					var itemcnt = StatusIDCount();

					if ( itemcnt - cp.param['max_count'] > 0 )
					{
						// 新着で読み込んだ分だけ削除
						timeline_list.find( '> div.item:gt(' + ( itemcnt - addcnt - 1 ) + ')' ).each( function() {
							delete status_ids[$( this ).attr( 'status_id' )];
//							timeline_list.scrollTop( timeline_list.scrollTop() - $( this ).outerHeight() );
							$( this ).remove();
						} );

						first_status_id = timeline_list.find( '> div.item:last' ).attr( 'status_id' );
					}

					// アイコンサイズ
					var items = timeline_list.find( '> div.item:lt(1)' );

					items.find( 'div.icon' ).css( { width: g_cmn.cmn_param['iconsize'] } )
						.find( '> img' ).css( { width: g_cmn.cmn_param['iconsize'], height: g_cmn.cmn_param['iconsize'] } )
						.end()
						.find( '.retweet img' ).css( { width: g_cmn.cmn_param['iconsize'] * 0.7, height: g_cmn.cmn_param['iconsize'] * 0.7 } );

					// ユーザーごとのアイコンサイズ適用
					SetUserIconSize( items );

					// 引用元表示
					QuoteSource( items );
				}
			} );
		}
	};

	////////////////////////////////////////////////////////////
	// 設定画面初期化
	////////////////////////////////////////////////////////////
	function SettingInit()
	{
		setting.find( '.tlsetting_apply' ).addClass( 'disabled' );

		// 現行値設定(スライダー)

		// 検索、ユーザーTL、リストは最小30秒(devモードは10秒)にできるようにする
		var min = 60;

		if ( cp.param['timeline_type'] == 'user' ||
			 cp.param['timeline_type'] == 'list' ||
			 cp.param['timeline_type'] == 'search' )
		{
			if ( g_devmode )
			{
				min = 10;
			}
			else
			{
				min = 30;
			}
		}

		setting.find( '.set_reload_time' ).slider( {
			min: min,
			max: 600,
			step: 30,
			value: cp.param['reload_time'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_reload_time' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0270' ) );
			},
		} );

		setting.find( '.set_get_count' ).slider( {
			min: 20,
			max: 200,
			step: 10,
			value: cp.param['get_count'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_get_count' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0204' ) );

				if ( setting.find( '.set_max_count' ).slider( 'value' ) < ui.value )
				{
					setting.find( '.set_max_count' ).slider( 'value', ui.value );
				}

				setting.find( '.set_max_count' ).slider( 'option', {
					min: ui.value,
				} );

				setting.find( '.set_max_count' ).parent().find( '.value_disp' ).html( setting.find( '.set_max_count' ).slider( 'value' ) + chrome.i18n.getMessage( 'i18n_0204' ) );
			},
		} );

		setting.find( '.set_max_count' ).slider( {
			min: cp.param['get_count'],
			max: 1000,
			step: 10,
			value: cp.param['max_count'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_max_count' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0204' ) );
			},
		} );

		var _users = {};

		// グループ設定
		if ( cp.param['timeline_type'] == 'group' )
		{
			// アカウント
			var acclist = setting.find( '.acclist' );

			var account_id;

			for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
			{
				account_id = g_cmn.account_order[i];
				acclist.append( OutputTPL( 'tlsetting_accsel', { item: g_cmn.account[account_id], account_id: account_id } ) );

				if ( account_id == cp.param['account_id'] )
				{
					acclist.find( 'div:last' ).addClass( 'selected' );
				}
			}

			acclist.find( 'div' ).on( 'click', function( e ) {
				acclist.find( 'div' ).removeClass( 'selected' );
				$( this ).addClass( 'selected' );

				if ( $( this ).attr( 'account_id' ) != cp.param['account_id'] )
				{
					setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				}

				e.stopPropagation();
			} );

			// メンバー
			var MakeMemberList = function() {
				var member_list = setting.find( '.member_list' );
				var cnt = 0;

				var s = '';

				for ( var user_id in _users )
				{
					s += OutputTPL( 'tlsetting_member', { item: _users[user_id] } );
					cnt++;
				}

				if ( s == '' )
				{
					s = '<span>' + chrome.i18n.getMessage( 'i18n_0162' ) + '</span>';
				}

				member_list.html( s );

				member_list.find( 'div' ).on( 'click', function( e ) {
					var account_id = setting.find( '.acclist' ).find( 'div.selected' ).attr( 'account_id' );

					if ( account_id )
					{
						OpenUserTimeline( $( this ).find( 'img' ).attr( 'tooltip' ), account_id );
					}

					e.stopPropagation();
				} )
				.on( 'contextmenu', function( e ) {
					var user_id = $( this ).attr( 'user_id' );

					delete _users[user_id];

					MakeMemberList();
					setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
					$( '#tooltip' ).hide();

					return false;
				} );

				setting.find( '.memcnt' ).html( cnt );
			};

			for ( var user_id in cp.param['users'] )
			{
				_users[user_id] = cp.param['users'][user_id];
			}

			MakeMemberList();

			// ドロップ処理
			setting.find( '.member_list' ).on( 'itemdrop', function( e, ui ) {
				if ( ui.draggable.hasClass( 'user' ) &&  ui.draggable.hasClass( 'fromtl' ) )
				{
					if ( setting.find( '.memcnt' ).html() == '300' )
					{
						MessageBox( chrome.i18n.getMessage( 'i18n_0069' ) );
					}
					else
					{
						var dropuser = {
							user_id: ui.draggable.attr( 'user_id' ),
							screen_name: ui.draggable.attr( 'screen_name' ),
							icon: ui.draggable.attr( 'icon' ),
							account_id: ui.draggable.attr( 'account_id' ),
							created_at: ui.draggable.attr( 'created_at' ),
						};

						_users[dropuser.user_id] = dropuser;

						MakeMemberList();
						setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
					}
				}
			} );

			setting.find( '.member_list' ).droppable( {
				accept: '.dropitem',
				greedy: true,
				drop: function( e, ui ) {
					setting.find( '.member_list' ).trigger( 'itemdrop', [ ui ] );
				},
			} );

			setting.find( '.set_title' ).keyup( function() {
				if ( $( this ).val() != cp.param['title'] )
				{
					setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				}
			} );
		}

		////////////////////////////////////////
		// 設定変更時処理
		////////////////////////////////////////
		setting.find( 'input' ).change( function( e ) {
			setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
		} );

		////////////////////////////////////////
		// 適用ボタンクリック処理
		////////////////////////////////////////
		setting.find( '.tlsetting_apply' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// タイムラインに表示する最大ツイート数
			cp.param['max_count'] = setting.find( '.set_max_count' ).slider( 'value' );

			// グループ設定
			if ( cp.param['timeline_type'] == 'group' )
			{
				// タイトル
				var title = setting.find( '.set_title' ).val();

				if ( title.length <= 0 )
				{
					MessageBox( chrome.i18n.getMessage( 'i18n_0076' ) );
					setting.find( '.set_title' ).focus();
					return false;
				}

				cp.param['title'] = title;
				cp.SetTitle( title, true );

				// アカウント
				var account_id = '';

				setting.find( '.acclist' ).find( 'div' ).each( function() {
					if ( $( this ).hasClass( 'selected' ) )
					{
						account_id = $( this ).attr( 'account_id' );
						return false;
					}
				} );

				cp.param['account_id'] = account_id;

				// メンバー
				cp.param['users'] = _users;

				cp.param['count'] = 0;

				for ( var user_id in _users )
					cp.param['count']++;

				// グループパネル管理に登録
				var _id = cp.id.replace( /^panel_/, '' );

				g_cmn.group_panel[_id] = {
					id: _id,
					param: cp.param,
				};

				// グループパネル一覧を表示している場合は一覧更新
				var pid = IsUnique( 'grouplist' );

				if ( pid != null )
				{
					$( '#grouplist_reload' ).trigger( 'click' );
					SetFront( p );
				}
			}
			// その他
			else
			{
				// 新着読み込み
				cp.param['reload_time'] = setting.find( '.set_reload_time' ).slider( 'value' );

				timeline_list.trigger( 'reload_timer' );

				// 一度に取得するツイート数
				cp.param['get_count'] = setting.find( '.set_get_count' ).slider( 'value' );

				// 新着あり通知
				cp.param['notify_new'] = ( setting.find( '.set_notify_new' ).prop( 'checked' ) ) ? 1 : 0;

				// 検索対象言語
				if ( cp.param['timeline_type'] == 'search' )
				{
					cp.param['search_lang'] = setting.find( 'input[class=set_search_lang]:checked' ).val();
				}
			}

			setting.find( '.tlsetting_apply' ).addClass( 'disabled' );

			SaveData();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 分類部クリック処理
		////////////////////////////////////////
		setting.find( '.kind' ).click( function( e ) {
			var img_off = 'icon-play';
			var img_on = 'icon-arrow_down';

			if ( $( this ).find( '> span' ).hasClass( img_on ) )
			{
				$( this ).find( '> span' ).removeClass( img_on ).addClass( img_off )
					.end()
					.next().slideUp( 0 );
			}
			else
			{
				$( this ).find( '> span' ).removeClass( img_off ).addClass( img_on )
					.end()
					.next().slideDown( 200 );
			}

			e.stopPropagation();
		} );

//		setting.find( '.kind' ).trigger( 'click' );
	}

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
		if ( tm != null )
		{
			clearTimeout( tm );
			tm = null;
		}
	};
}