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
						limit: count
					}
				};

				break;
			// ローカル
			case 'local':
				param = {
					api: 'timelines/public',
					data: {
						local: true,
						limit: count
					}
				};
			
				break;
			// 連合
			case 'federated':
				param = {
					api: 'timelines/public',
					data: {
						limit: count
					}
				};

				break;
			// ユーザ
			case 'user':
				param = {
					api: 'accounts/' + cp.param['id'] + '/statuses',
					data: {
						limit: count
					}
				};

				break;
			// ハッシュタグ
			case 'hashtag':
				param = {
					api: 'timelines/tag/' + encodeURIComponent( cp.param['hashtag'] ),
					data: {
						limit: count
					}
				};

				break;
			// 通知
			case 'notifications':
				param = {
					api: 'notifications',
					data: {
						limit: count
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
				if ( res.status === undefined )
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

						if ( status_ids[res[i].id + '@' + instance] == undefined )
						{
							if ( cp.param['timeline_type'] == 'notifications' )
							{
								s += MakeNotifications( res[i], cp.param['account_id'] );
							}
							else
							{
								s += MakeTimeline( res[i], cp.param['account_id'] );
							}
							
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
										delete status_ids[$( this ).attr( 'status_id' ) + '@' + $( this ).attr( 'instance' )];
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
		// このパネルを開いたアカウントが
		// 削除された場合
		////////////////////////////////////////
		var AccountAliveCheck = function() {
			if ( g_cmn.account[cp.param['account_id']] == undefined )
			{
				// パネルを閉じる
				p.find( '.close' ).trigger( 'click', [false] );
				return false;
			}

			return true;
		};

		////////////////////////////////////////
		// アカウント情報更新
		////////////////////////////////////////
		cont.on( 'account_update', function() {
			AccountAliveCheck();
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
			case 'user':
				cp.param['display_name'] = ( cp.param['display_name'] == '' ) ? cp.param['username'] : cp.param['display_name'];
				
				if ( cp.param['instance'] == account.instance )
				{
					cp.SetTitle( cp.param['display_name'] + ' (' + account.display_name + '@' + account.instance + ')', true );
				}
				else
				{
					cp.SetTitle( cp.param['display_name'] + '@' + cp.param['instance'] + ' (' + account.display_name + '@' + account.instance + ')', true );
				}

				cp.SetIcon( 'icon-user' );
				break;
			case 'hashtag':
				cp.SetTitle( cp.param['hashtag'] + ' (' + account.display_name + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-hash' );
				break;
			case 'notifications':
				cp.SetTitle( i18nGetMessage( 'i18n_0093' ) + ' (' + account.display_name + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-notifications' );
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
		// クリックイベント
		////////////////////////////////////////
		timeline_list.click( function( e ) {
			var targ = $( e.target );
			var ptarg = targ.parent();

			////////////////////////////////////////
			// 名前クリック
			////////////////////////////////////////
			if ( targ.hasClass( 'username' ) || targ.hasClass( 'display_name' ) )
			{
				var item = targ.closest( '.item' );

				OpenUserTimeline( cp.param['account_id'], item.attr( 'id' ), ptarg.find( '.username' ).text(),
					ptarg.find( '.display_name' ).text(), item.attr( 'instance' ) );
			}
			////////////////////////////////////////
			// アイコンクリック
			////////////////////////////////////////
			else if ( ptarg.hasClass( 'avatar' ) )
			{
				var item = targ.closest( '.item' );

				OpenUserProfile( item.attr( 'id' ), item.attr( 'instance' ), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// リンククリック処理
			////////////////////////////////////////
			else if ( targ.hasClass( 'anchor' ) )
			{
				if ( targ.hasClass( 'url' ) )
				{
					var url = targ.attr( 'href' );
					window.open( url, '_blank' );
					return false;
				}

				if ( targ.hasClass( 'user' ) )
				{
					OpenUserTimeline( cp.param['account_id'], targ.attr( 'id' ), targ.attr( 'username' ),
						'', GetInstanceFromAcct( targ.attr( 'acct' ), cp.param['account_id'] ) );
				}

				if ( targ.hasClass( 'hashtag' ) )
				{
					OpenHashtagTimeline( cp.param['account_id'], targ.text() );
				}
			}
			
			
			////////////////////////////////////////
			// もっと見る⇔隠す
			////////////////////////////////////////
			else if ( targ.hasClass( 'showmore_button' ) )
			{
				var toot_text = ptarg.parent().find( '.toot_text' );

				if ( toot_text.hasClass( 'off' ) )
				{
					toot_text.removeClass( 'off' );
					targ.html( i18nGetMessage( 'i18n_0369' ) );
				}
				else
				{
					toot_text.addClass( 'off' );
					targ.html( i18nGetMessage( 'i18n_0368' ) );
				}
			}
			////////////////////////////////////////
			// NSFW表示切り替え
			////////////////////////////////////////
			else if ( targ.hasClass( 'nsfw_change' ) )
			{
				ptarg.find( '.images' ).toggle();
				targ.html( i18nGetMessage( ( ptarg.find( '.images' ).css( 'display' ) == 'none' ) ? 'i18n_0370' : 'i18n_0371' ) );
			}
			////////////////////////////////////////
			// サムネイルクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'thumbnail' ) )
			{
				var _cp = new CPanel( null, null, 320, 320 );
				_cp.SetType( 'image' );
				_cp.SetParam( {
					urls: targ.closest( '.thumbnails' ).attr( 'urls' ),
					index: targ.attr( 'index' ),
				} );
				_cp.Start();
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

				var item = targ.closest( '.item' );

				// 最初にクリックされたときにメニューボックス部を作成
				if ( item.find( '.menubox' ).length == 0 )
				{
					item.find( '.toot' ).append( OutputTPL( 'timeline_menu', {
						toolbaruser: ( IsToolbarUser( cp.param['account_id'], item.attr( 'id' ), item.attr( 'instance' ) ) != -1 ) ? true : false,
					} ) );

					var menubox = item.find( 'div.toot' ).find( 'div.menubox' );

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
							var index = IsToolbarUser( cp.param['account_id'], item.attr( 'id' ), item.attr( 'instance' ) );

							if ( index != -1 )
							{
								g_cmn.toolbaar_user.splice( index, 1 );
							}

							$( this ).attr( 'toolbaruser', false ).html( chrome.i18n.getMessage( 'i18n_0092' )  );

							UpdateToolbarUser();
						}
						// ツールバーに登録
						else
						{
							if ( IsToolbarUser( cp.param['account_id'], item.attr( 'id' ), item.attr( 'instance' ) ) == -1 )
							{
								g_cmn.toolbar_user.push( {
									account_id: cp.param['account_id'],
									created_at: item.attr( 'created_at' ),
									avatar: item.attr( 'avatar' ),
									display_name: item.attr( 'display_name' ),
									username: item.attr( 'username' ),
									id: item.attr( 'id' ),
									instance: item.attr( 'instance' ),
									type: 'user'
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
			else
			{
				return;
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// BTアイコン右クリック
		////////////////////////////////////////
		timeline_list.on( 'contextmenu', '> div.item div.boost img.bt_avatar', function( e ) {
			var ptarg = $( this ).parent();

			OpenUserTimeline( cp.param['account_id'], ptarg.attr( 'bt_id' ), ptarg.attr( 'bt_username' ),
				ptarg.attr( 'bt_display_name' ), ptarg.attr( 'bt_instance' ) );

			return false;
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', '> div.item div.avatar > img', function( e ) {
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
		// カーソルを乗せたとき（ボタン群表示）
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', '> div.item', function( e ) {
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
		} );

		////////////////////////////////////////
		// スクロール抑止
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', '> div.item div.options span', function( e ) {
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
		timeline_list.on( 'click', '> div.readmore', function( e ) {
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




/*
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
*/



	};

	////////////////////////////////////////////////////////////
	// 設定画面初期化
	////////////////////////////////////////////////////////////
	function SettingInit()
	{
		setting.find( '.tlsetting_apply' ).addClass( 'disabled' );

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

			// 新着あり通知
			cp.param['notify_new'] = ( setting.find( '.set_notify_new' ).prop( 'checked' ) ) ? 1 : 0;

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
