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
	var status_cnt = 0;
	var first_status_id = null;
	var last_status_id = null;
	var scrollPos = null;
	var scrollHeight = null;
	var cursor_on_option = false;
	var socket = null;
	var active_users = {};
	var over_cnt = 0;

	///////////////////////////////////////////////////////////////////
	// タイトル設定
	///////////////////////////////////////////////////////////////////
	var SetTitle = function( users ) {
		var account = g_cmn.account[cp.param['account_id']];
		var open_acc = ConvertDisplayName( account.display_name, account.username );

		switch ( cp.param['timeline_type'] )
		{
			case 'home':
				cp.SetTitle( i18nGetMessage( 'i18n_0152' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-home' );
				break;
			case 'local':
				cp.SetTitle( i18nGetMessage( 'i18n_0365' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-users2' );
				cont.find( '.panel_btns' ).find( '.instance_info' ).show();
				break;
			case 'media':
				cp.SetTitle( i18nGetMessage( 'i18n_0007' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-image2' );
				break;
			case 'federated':
				cp.SetTitle( i18nGetMessage( 'i18n_0366' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-earth' );
				break;
			case 'user':
				var display_name_disp = ConvertDisplayName( cp.param.display_name, cp.param.username );

				if ( cp.param['instance'] == account.instance )
				{
					cp.SetTitle( display_name_disp + ' (' + open_acc + '@' + account.instance + ')', true );
				}
				else
				{
					cp.SetTitle( display_name_disp + '@' + cp.param['instance'] + ' (' + open_acc + '@' + account.instance + ')', true );
				}

				cp.SetIcon( 'icon-user' );
				cont.find( '.panel_btns' ).find( '.streamctl' ).hide();
				
				break;
			case 'hashtag':
				cp.SetTitle( cp.param['hashtag'] + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-hash' );
				break;
			case 'notifications':
				cp.SetTitle( i18nGetMessage( 'i18n_0093' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-bell' );

				cont.find( '.panel_btns' ).find( '.clear_notification' ).show();
				break;

			case 'favourites':
				cp.SetTitle( i18nGetMessage( 'i18n_0403' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-star' );
				cont.find( '.panel_btns' ).find( '.streamctl' ).hide();
				break;

			case 'expand':
				cp.SetTitle( i18nGetMessage( 'i18n_0404' ) + ' (' + open_acc + '@' + account.instance + ')', true );
				cp.SetIcon( 'icon-bubbles2' );
				cont.find( '.panel_btns' ).find( '.streamctl' ).hide();
				break;
		}
	};

	///////////////////////////////////////////////////////////////////
	// ツールバーユーザーの情報を最新に更新
	///////////////////////////////////////////////////////////////////
	var UserInfoUpdate = function( users ) {
		var idx;
		var updflg = false;

		for ( var user_id in users )
		{
			var _data = user_id.split( '@' );
			var _id = _data[0];
			var _instance = _data[1];

			// ツールバーユーザー
			for ( var idx = 0, _len = g_cmn.toolbar_user.length ; idx < _len ; idx++ )
			{
				if ( g_cmn.toolbar_user[idx].id == _id && g_cmn.toolbar_user[idx].instance == _instance )
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
						if ( g_cmn.toolbar_user[idx].avatar != users[user_id].avatar )
						{
							g_cmn.toolbar_user[idx].avatar = users[user_id].avatar;
							chk = true;
						}

						// スクリーン名に変更がないか？
						if ( g_cmn.toolbar_user[idx].display_name != users[user_id].display_name )
						{
							g_cmn.toolbar_user[idx].display_name = users[user_id].display_name;
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
			// メディア
			case 'media':
				param = {
					api: 'timelines/public',
					data: {
						local: true,
						media: true,
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
			// お気に入り
			case 'favourites':
				param = {
					api: 'favourites',
					data: {
						limit: count
					}
				};

				break;

			// 詳細を表示
			case 'expand':
				param = {
					api: 'statuses/' + cp.param['id'] + '/context',
					data: {
					}
				};

				break;
		}

		switch ( type )
		{
			// 初期
			case 'init':
				status_ids = {};
				status_cnt = 0;
				
				break;
			// 更新
			case 'reload':
				status_ids = {};
				status_cnt = 0;
				
				break;
			// 新着
			case 'new':
				if ( last_status_id == null )
				{
					// 一度も読み込んでいない場合は、初期として扱う
					type = 'init';
					status_ids = {};
					status_cnt = 0;
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

		Loading( true, 'timeline' );

		// API呼び出し
		SendRequest(
			{
				method: 'GET',
				action: 'api_call',
				instance: g_cmn.account[cp.param['account_id']].instance,
				access_token: g_cmn.account[cp.param['account_id']].access_token,
				api: param.api,
				param: param.data
			},
			function( res )
			{
				var _maketimeline = function( res )
				{
					if ( res.status === undefined )
					{
						var s = '';
						var len;
						var addcnt = 0;
						var users = {};

						len = res.length;

						for ( var i = 0 ; i < len ; i++ )
						{
							if ( !res[i].account )
							{
								continue;
							}

							var instance = GetInstanceFromAcct( res[i].account.acct, g_cmn.account[cp.param['account_id']].instance );

							if ( status_ids[res[i].id + '@' + instance] == undefined )
							{
								s += MakeTimeline( res[i], cp );

								status_ids[res[i].id + '@' + instance] = true;
								status_cnt++;

								active_users[res[i].account.id + '@' + instance] = true;

								addcnt++;

								if ( users[res[i].account.id + '@' + instance] == undefined )
								{
									users[res[i].account.id + '@' + instance] = {
										avatar: ImageURLConvert( res[i].account.avatar, res[i].account.acct, g_cmn.account[cp.param.account_id].instance ),
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
								if ( res.max_id )
								{
									first_status_id = res.max_id;
								}
							}

							// 一番新しいツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'new' )
							{
								if ( res.since_id )
								{
									last_status_id = res.since_id;
								}
							}
						}

						// もっと読む
						var AppendReadmore = function() {
							if ( first_status_id )
							{
								timeline_list.append(
									'<div class="btn img readmore icon-arrow_down tooltip" tooltip="' + i18nGetMessage( 'i18n_0157' ) + '"></div>' );
							}
						};

						UserInfoUpdate( users );

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

								if ( cp.param.timeline_type == 'expand' )
								{
									cont.find( '.item[status_id="' + cp.param.id + '"]' ).addClass( 'source' );
								}

								break;
							// 新着
							case 'new':
								if ( addcnt > 0 )
								{
									var _scheight = timeline_list.prop( 'scrollHeight' );
									var _sctop = timeline_list.scrollTop();

									timeline_list.prepend( s );

									// 新着ツイートにスクロールする
									if ( g_cmn.cmn_param['newscroll'] == 1 && _sctop == 0 && !cursor_on_option )
									{
									}
									else
									{
										var scheight = timeline_list.prop( 'scrollHeight' );
										timeline_list.scrollTop( _sctop + ( scheight - _scheight ) );
									}

									timeline_list.find( '> div.item:lt(' + addcnt + ')' ).addClass( 'new' );
									newitems = $( timeline_list.find( '> div.item.new' ).get() );

									// 新着件数
									badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
									$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();

									timeline_list.trigger( 'scroll' );

									// "表示最大数を超えている件数
									if ( status_cnt - cp.param['max_count'] > 0 )
									{
										// 新着で読み込んだ分だけ削除
										var delitems = timeline_list.find( '> div.item:gt(' + ( status_cnt - addcnt - 1 ) + ')' );
										
										for ( var i = 0, _len = delitems.length ; i < _len ; i++ )
										{
											delete status_ids[$( delitems[i] ).attr( 'status_id' ) + '@' + $( delitems[i] ).attr( 'instance' )];
											status_cnt--;
										}

										delitems.remove();
										first_status_id = timeline_list.find( '> div.item' ).last().attr( 'status_id' );
									}
								}

								break;
							// もっと読む
							case 'old':
								if ( addcnt > 0 )
								{
									timeline_list.append( s );

									AppendReadmore();
								}

								timeline_list.find( '.readmore' ).first().remove();
								$( '#tooltip' ).hide();

								break;
						}
					}
					else
					{
						// もっと読むで404の場合
						if ( type == 'old' && res.status == 404 )
						{
							timeline_list.find( '.readmore' ).first().remove();
							$( '#tooltip' ).hide();
						}
						else
						{
							ApiError( res );
						}
					}

					Loading( false, 'timeline' );

					// ストリーミングをONにする
					if ( type == 'init' )
					{
						if ( cp.param.streaming )
						{
							lines.find( '.streamctl > a' ).trigger( 'click' );
						}
					}
				};

				// 詳細表示以外
				if ( cp.param.timeline_type != 'expand' )
				{
					_maketimeline( res );
				}
				// 詳細表示は元Tootを追加して、結果を加工
				else
				{
					var context = res;

					SendRequest(
						{
							method: 'GET',
							action: 'api_call',
							instance: g_cmn.account[cp.param['account_id']].instance,
							access_token: g_cmn.account[cp.param['account_id']].access_token,
							api: 'statuses/' + cp.param.id,
						},
						function( res )
						{
							if ( res.status === undefined )
							{
								var _cnt = 0;
								var _res = [];
								
								for ( var i = 0 ; i < context.ancestors.length ; i++ )
								{
									_res[_cnt++] = context.ancestors[i];
								}

								_res[_cnt++] = res;

								for ( var i = 0 ; i < context.descendants.length ; i++ )
								{
									_res[_cnt++] = context.descendants[i];
								}

								res = _res;
							}

							_maketimeline( res );
						}
					);
				}
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
			if ( AccountAliveCheck() )
			{
				SetTitle();
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

		if ( cp.param.timeline_type == 'notifications' )
		{
			if ( cp.param.dn_new_followers == undefined )
			{
				cp.param.dn_new_followers = 1;
			}
			
			if ( cp.param.dn_favourites == undefined )
			{
				cp.param.dn_favourites = 1;
			}
			
			if ( cp.param.dn_mentions == undefined )
			{
				cp.param.dn_mentions = 1;
			}
			
			if ( cp.param.dn_boosts == undefined )
			{
				cp.param.dn_boosts = 1;
			}
		}

		if ( cp.param.timeline_type != 'notifications' )
		{
			if ( cp.param.tl_nsfw == undefined )
			{
				cp.param.tl_nsfw = 0;
			}
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

		cont.find( '.panel_btns' ).find( '.instance_info' ).hide();
		cont.find( '.panel_btns' ).find( '.clear_notification' ).hide();

		SetTitle();

		/* インスタンス情報 */
		if ( cp.param['timeline_type'] == 'local' )
		{
			$.ajax( {
				type: 'GET',
				url: 'https://' + account.instance + '/about/more',
				dataType: 'html',
			} ).done( function( data ) {
				var _j = $( data );

				lines.find( '.instance_info_window .users' ).html( _j.find( '.information-board .section' ).eq(0).find( '> strong' ).text() );
				lines.find( '.instance_info_window .statuses' ).html( _j.find( '.information-board .section' ).eq(1).find( '> strong' ).text() );

				SendRequest(
					{
						method: 'GET',
						action: 'api_call',
						instance: account.instance,
						api: 'instance',
					},
					function( res )
					{
						if ( res.status === undefined )
						{
							lines.find( '.instance_info_window .version' ).html( res.version );
						}
					}
				);
			} );
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
			var unit = i18nGetMessage( 'i18n_0270' );

			if ( status_cnt < 1 )
			{
				spd = '--';
				unit = '--';
			}
			else
			{
				var firstdate = new Date();
				var lastdate = Date.parse( timeline_list.find( '> div.item' ).last().attr( 'created_at' ).replace( '+', 'GMT+' ) );

				spd = status_cnt / ( firstdate - lastdate ) * 1000;

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
						unit = i18nGetMessage( 'i18n_0272' );
					}

					// 時速
					if ( spd < 1 )
					{
						spd = spd * 60;
						unit = i18nGetMessage( 'i18n_0299' );
					}

					// 日速
					if ( spd < 1 )
					{
						spd = spd * 24;
						unit = i18nGetMessage( 'i18n_0259' );
					}

					spd = Math.floor( spd * 100 ) / 100;
				}
			}

			var s = i18nGetMessage( 'i18n_0037' ) + ': ' + spd + '/' + unit;
			s += ' ' + i18nGetMessage( 'i18n_0012' ) + ': ' + Object.keys( active_users ).length + i18nGetMessage( 'i18n_0013' );

			$( this ).attr( 'tooltip', s );
		} );

		////////////////////////////////////////
		// 新着読み込みタイマー開始
		////////////////////////////////////////
		timeline_list.on( 'reload_timer', function() {
			// 詳細表示はタイマーなし
			if ( cp.param.timeline_type == 'expand' )
			{
				return;
			}
			
			// タイマーを止める
			if ( tm != null )
			{
				clearInterval( tm );
				tm = null;
			}

			tm = setInterval( function() {
				if ( socket == null )
				{
					ListMake( cp.param['get_count'], 'new' );
				}
			}, cp.param['reload_time'] * 1000 );
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.timeline_reload' ).click( function() {
			timeline_list.trigger( 'reload_timer' );
			ListMake( cp.param['get_count'], 'reload' );
		} );

		////////////////////////////////////////
		// インスタンス情報ボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.instance_info' ).click( function() {
			lines.find( '.instance_info_window' ).toggle();
		} );

		////////////////////////////////////////
		// 通知消去ボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.clear_notification' ).click( function() {
			if ( confirm( i18nGetMessage( 'i18n_0391' ) ) )
			{
				Blackout( true );
				Loading( true, 'clear_notification' );

				SendRequest(
					{
						method: 'POST',
						action: 'api_call',
						instance: g_cmn.account[cp.param['account_id']].instance,
						access_token: g_cmn.account[cp.param['account_id']].access_token,
						api: 'notifications/clear',
					},
					function( res )
					{
						if ( res.status === undefined )
						{
							ListMake( cp.param['get_count'], 'reload' );
						}
						else
						{
							ApiError( res );
						}

						Blackout( false );
						Loading( false, 'clear_notification' );
					}
				);
			}
		} );

		////////////////////////////////////////
		// 一番上へ
		////////////////////////////////////////
		lines.find( '.sctbl' ).find( 'a' ).first().click( function( e ) {
			timeline_list.scrollTop( 0 );
		} );

		////////////////////////////////////////
		// 一番下へ
		////////////////////////////////////////
		lines.find( '.sctbl' ).find( 'a' ).last().click( function( e ) {
			timeline_list.scrollTop( timeline_list.prop( 'scrollHeight' ) );
		} );

		////////////////////////////////////////
		// ストリーミング開始/停止
		////////////////////////////////////////
		function SetStreamStatus( status )
		{
			lines.find( '.streamctl > a' ).removeClass( 'on off try' ).addClass( status );
		}
		
		lines.find( '.streamctl > a' ).click( function( e ) {
			var account = g_cmn.account[cp.param.account_id];

			if ( lines.find( '.streamctl' ).css( 'display' ) == 'none' )
			{
				return;
			}

			var StreamingConnect = function() {
				// 開始
				if ( lines.find( '.streamctl > a' ).hasClass( 'off' ) )
				{
					SetStreamStatus( 'try' );

					cp.param.streaming = true;

					var api = g_cmn.notsave.instances[account.instance].streaming_api + '/api/v1/streaming/?access_token=' + account.access_token + '&stream=';

					switch( cp.param.timeline_type )
					{
						case 'home':
						case 'notifications':
							api += 'user';
							break;
						case 'local':
							api += 'public:local';
							break;
						case 'media':
							api += 'public:local';
							break;
						case 'federated':
							api += 'public';
							break;
						case 'hashtag':
							api += 'hashtag&tag=' + encodeURIComponent( cp.param['hashtag'] );
							break;
					}

					socket = new WebSocket( api );

					socket.onopen = function( e ) {
						SetStreamStatus( 'on' );
					};

					socket.onmessage = function( e ) {
						var _json = JSON.parse( e.data );

						var json = {
							event: _json.event,
						};

						if ( _json.payload )
						{
							if ( json.event == 'update' || json.event == 'notification' )
							{
								Object.assign( json, JSON.parse( _json.payload ) );
							}
							else if ( json.event == 'delete' )
							{
								json.id = _json.payload;
							}
						}

						cont.trigger( 'streaming', [{ action: 'stream_recieved', json: json }] );
					};

					socket.onerror = function( e ) {
						console.log( 'socket error' );
						console.log( e );
						socket = null;
						SetStreamStatus( 'off' );
					};

					socket.onclose = function( e ) {
						socket = null;
						SetStreamStatus( 'off' );
					};
				}
				// 停止
				else if( lines.find( '.streamctl > a' ).hasClass( 'on' ) )
				{
					SetStreamStatus( 'try' );
					cp.param.streaming = false;
					socket.close();
				}
			};
			
			// Streamingの接続先をAPIで取得する
			if ( g_cmn.notsave.instances[account.instance] )
			{
				StreamingConnect();
			}
			else
			{
				SendRequest(
					{
						method: 'GET',
						action: 'api_call',
						instance: account.instance,
						api: 'instance',
					},
					function( res )
					{
						g_cmn.notsave.instances[account.instance] = {
							streaming_api: 'wss://' + account.instance
						};

						if ( res.status === undefined )
						{
							if ( res.urls )
							{
								g_cmn.notsave.instances[account.instance].streaming_api = res.urls.streaming_api;
							}
						}

						StreamingConnect();
					}
				);
			}
		} );

		////////////////////////////////////////
		// ストリーミング処理
		////////////////////////////////////////
		cont.on( 'streaming', function( e, data ) {
			if ( data.action == 'stream_recieved' )
			{
				var addcnt = 0;

				var _sctop = timeline_list.scrollTop();

				/* メディアタイムラインはmedia_attachmentsなしを排除 */
				if ( cp.param.timeline_type == 'media' && data.json.media_attachments == 0 )
				{
					return false;
				}

				if ( ( cp.param.timeline_type != 'notifications' && data.json.event == 'update' ) ||
					 ( cp.param.timeline_type == 'notifications' && data.json.event == 'notification' ) )
				{
					timeline_list.prepend( MakeTimeline( data.json, cp ) ).children().first().hide().fadeIn();;

					if ( !data.json.account )
					{
						return false;
					}

					var instance = GetInstanceFromAcct( data.json.account.acct, g_cmn.account[cp.param.account_id].instance );
					
					status_ids[data.json.id + '@' + instance] = true;
					status_cnt++;

					active_users[data.json.account.id + '@' + instance] = true;

					var users = {};
					users[data.json.account.id + '@' + instance] = {
						avatar: ImageURLConvert( data.json.account.avatar, data.json.account.acct, g_cmn.account[cp.param.account_id].instance ),
						display_name: data.json.account.display_name,
						created_at: data.json.account.created_at,
					};
					
					UserInfoUpdate( users );
					addcnt++;

					// デスクトップ通知
					if ( data.json.event == 'notification' )
					{
						var options = {};
						var show_notification = false;
						var display_name_disp = ( data.json.account.display_name ) ? data.json.account.display_name : data.json.account.username;

						if ( data.json.type == 'follow' && cp.param.dn_new_followers )
						{
							options.title = display_name_disp + i18nGetMessage( 'i18n_0372' );
							options.body = '';
							show_notification = true;
						}
						else
						{
							var _jq = $( '<div>' + data.json.status.content + '</div>' );
							
							options.body = _jq.text();

							if ( data.json.type == 'favourite' && cp.param.dn_favourites )
							{
								options.title = display_name_disp + i18nGetMessage( 'i18n_0373' );
								show_notification = true;
							}

							if ( data.json.type == 'mention' && cp.param.dn_mentions )
							{
								options.title = display_name_disp;
								show_notification = true;
							}

							if ( data.json.type == 'reblog' && cp.param.dn_boosts )
							{
								options.title = display_name_disp + i18nGetMessage( 'i18n_0374' );
								show_notification = true;
							}
						}

						if ( show_notification )
						{
							var dn = new Notification( options.title, {
								body: options.body,
								icon: ImageURLConvert( data.json.account.avatar, data.json.account.acct, g_cmn.account[cp.param.account_id].instance ),
							} );

							$( '#notify_sound' ).get( 0 ).volume = g_cmn.cmn_param.notify_sound_volume;
							$( '#notify_sound' ).get( 0 ).play();
						}
					}

					last_status_id = data.json.id;
				}
				// トゥート削除
				else if ( data.json.event == 'delete' )
				{
					$( '.timeline_list' ).find( '.item[status_id=' + data.json.id +']' ).addClass( 'deleted' );
				}

				if ( addcnt > 0 )
				{
					// 新着ツイートにスクロールする
					if ( g_cmn.cmn_param['newscroll'] == 1 && _sctop == 0 && !cursor_on_option )
					{
					}
					else
					{
						var scheight = timeline_list.prop( 'scrollHeight' );
						timeline_list.scrollTop( _sctop + ( timeline_list.find( '>div.item' ).eq(0).outerHeight() ) );
					}

					timeline_list.find( '> div.item:lt(1)' ).addClass( 'new' );
					newitems = $( timeline_list.find( '> div.item.new' ).get() );

					badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();

					timeline_list.trigger( 'scroll' );

					// "表示最大数を超えている件数
					if ( status_cnt - cp.param['max_count'] > 0 )
					{
						over_cnt += addcnt;

						// 10件分溜めてから消す
						if ( over_cnt >= 10 )
						{
							var delitems = timeline_list.find( '> div.item:gt(' + ( status_cnt - over_cnt - 1 ) + ')' );

							for ( var i = 0, _len = delitems.length ; i < _len ; i++ )
							{
								delete status_ids[$( delitems[i] ).attr( 'status_id' ) + '@' + $( delitems[i] ).attr( 'instance' )];
								status_cnt--;
							}

							delitems.remove();

							first_status_id = timeline_list.find( '> div.item' ).last().attr( 'status_id' );
							over_cnt = 0;
						}
					}
				}
			}
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
			if ( targ.hasClass( 'username' ) || targ.hasClass( 'display_name' ) || ptarg.hasClass( 'display_name' ) )
			{
				var item = targ.closest( ( ptarg.hasClass( 'notification' ) || ptarg.parent().hasClass( 'notification' ) ) ? '.notification' : '.item' );

				OpenUserTimeline( cp.param['account_id'], item.attr( 'id' ), item.attr( 'username' ),
					item.attr( 'display_name' ), item.attr( 'instance' ) );
			}
			////////////////////////////////////////
			// アイコンクリック
			////////////////////////////////////////
			else if ( ptarg.hasClass( 'avatar' ) )
			{
				var item = targ.closest( '.item' );

				if ( targ.prop( 'tagName' ) == 'IMG' )
				{
					OpenUserProfile( item.attr( 'id' ), item.attr( 'instance' ), cp.param['account_id'] );
				}
			}
			////////////////////////////////////////
			// BTアイコンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'bt_avatar' ) )
			{
				OpenUserProfile( ptarg.attr( 'bt_id' ), ptarg.attr( 'bt_instance' ), cp.param['account_id'] );
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
						'', GetInstanceFromAcct( targ.attr( 'acct' ), g_cmn.account[cp.param['account_id']].instance ) );
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
				var _cp = new CPanel( null, null, g_defwidth, g_defheight );
				_cp.SetType( 'image' );
				_cp.SetParam( {
					urls: targ.closest( '.thumbnails' ).attr( 'urls' ),
					types: targ.closest( '.thumbnails' ).attr( 'types' ),
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

					// 色の設定をインポート
					var _tag = '[Kurotodon_color_v1.1]';
					var color_setting = item.find( '.toot_text' ).text().indexOf( _tag );
					var colorcnt = 12;

					if ( color_setting == -1 )
					{
						menubox.find( '> a.import_color' ).hide();
					}
					else
					{
						// 正しい形式かチェック
						var chk = true;
						var colors = item.find( '.toot_text' ).text().substr( color_setting + _tag.length, colorcnt * 7 - 1 );
						var col;

						if ( colors.length == colorcnt * 7 - 1 )
						{
							col = colors.split( ',' );

							if ( col.length == colorcnt )
							{
								for ( var i = 0 ; i < col.length ; i++ )
								{
									if ( !col[i].match( /[0-9,a-z]{6}/i ) )
									{
										chk = false;
										break;
									}
								}
							}
							else
							{
								chk = false;
							}
						}
						else
						{
							chk = false;
						}

						if ( chk == false )
						{
							menubox.find( '> a.import_color' ).hide();
						}
						else
						{
							menubox.find( '> a.import_color' ).on( 'click', function( e ) {
								g_cmn.cmn_param.color = {
									panel: {
										background: '#' + col[0],
										text: '#' + col[1],
									},
									toot: {
										background: '#' + col[2],
										text: '#' + col[3],
										link: '#' + col[4],
									},
									titlebar: {
										background: '#' + col[5],
										text: '#' + col[6],
										fixed: '#' + col[7],
									},
									button: {
										background: '#' + col[8],
										text: '#' + col[9],
									},
									scrollbar: {
										background: '#' + col[10],
										thumb: '#' + col[11],
									}
								};

								SetColorSettings();
							} );
						}
					}

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
								g_cmn.toolbar_user.splice( index, 1 );
							}

							$( this ).attr( 'toolbaruser', false ).html( i18nGetMessage( 'i18n_0092' )  );

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

							$( this ).attr( 'toolbaruser', true ).html( i18nGetMessage( 'i18n_0091' ) );

							UpdateToolbarUser();
						}

						e.stopPropagation();
					} );

					// 詳細表示
					menubox.find( '> a.expandstatus' ).on( 'click', function( e ) {
						var dupchk = DuplicateCheck( {
							type: 'timeline',
							param: {
								account_id: cp.param.account_id,
								timeline_type: 'expand',
								id: item.attr( 'status_id' ),
							}
						} );

						if ( dupchk == -1 )
						{
							var _cp = new CPanel( null, null, g_defwidth, g_defheight_l );
							_cp.SetType( 'timeline' );

							_cp.SetParam( {
								account_id: cp.param.account_id,
								timeline_type: 'expand',
								id: item.attr( 'status_id' ),
								reload_time: g_cmn.cmn_param['reload_time'],
								streaming: false,
							} );
							_cp.Start();
						}

						e.stopPropagation();
					} );

					// 読み上げ
					menubox.find( '> a.speech' ).on( 'click', function( e ) {
						var text = item.find( '.toot' ).find( '.toot_text' ).text();
						var uttr = new SpeechSynthesisUtterance( text );
						uttr.lang = 'ja-JP';

						speechSynthesis.cancel();
						speechSynthesis.speak( uttr );
						e.stopPropagation();
					} );

					// 別アカウントでブースト
					menubox.find( '> a.boost_other' ).on( 'click', function( e ) {
						var account_list = item.find( '.menubox .remote_account_list.boost_account' );

						if ( account_list.css( 'display' ) == 'none' )
						{
							var s = '';

							for ( var i = 0 ; i < g_cmn.account_order.length ; i++ )
							{
								var id = g_cmn.account_order[i];

								if ( id != cp.param.account_id )
								{
									s += '<div class="remote_account" account_id="' + id + '">' +
										 '<span>' + ConvertDisplayName( g_cmn.account[id].display_name, g_cmn.account[id].username ) + '</span>' +
										 '<span>@' + g_cmn.account[id].instance + '</span>' +
										 '</div>';
								}
							}
							account_list.show().html( s );
						}
						else
						{
							account_list.hide();
						}

						e.stopPropagation();
					} );

					menubox.on( 'click', '> .remote_account_list.boost_account .remote_account', function( e ) {
						var account = g_cmn.account[$( this ).attr( 'account_id' )];

						var url = item.find( '.status_url' ).attr( 'href' );
						
						SendRequest(
							{
								method: 'GET',
								action: 'api_call',
								instance: account.instance,
								access_token: account.access_token,
								api: 'search',
								param: {
									q: url,
								}
							},
							function( res )
							{
								if ( res.status === undefined )
								{
									if ( res.statuses.length > 0 )
									{
										Loading( true, 'remote_boost' );

										SendRequest(
											{
												method: 'POST',
												action: 'api_call',
												instance: account.instance,
												access_token: account.access_token,
												api: 'statuses/' + res.statuses[0].id + '/reblog',
											},
											function( res )
											{
												if ( res.status === undefined )
												{
												}
												else
												{
													ApiError( res );
												}

												Loading( false, 'remote_boost' );
											}
										);
									}
								}
								else
								{
									ApiError( res );
								}

								item.find( '.menubox .remote_account_list.boost_account' ).hide();
								Loading( false, 'remote_boost_search' );
							}
						);

						e.stopPropagation();
					} );

					// 別アカウントでお気に入り
					menubox.find( '> a.favorite_other' ).on( 'click', function( e ) {
						var account_list = item.find( '.menubox .remote_account_list.favorite_account' );

						if ( account_list.css( 'display' ) == 'none' )
						{
							var s = '';

							for ( var i = 0 ; i < g_cmn.account_order.length ; i++ )
							{
								var id = g_cmn.account_order[i];

								if ( id != cp.param.account_id )
								{
									s += '<div class="remote_account" account_id="' + id + '">' +
										 '<span>' + ConvertDisplayName( g_cmn.account[id].display_name, g_cmn.account[id].username ) + '</span>' +
										 '<span>@' + g_cmn.account[id].instance + '</span>' +
										 '</div>';
								}
							}
							account_list.show().html( s );
						}
						else
						{
							account_list.hide();
						}

						e.stopPropagation();
					} );

					menubox.on( 'click', '> .remote_account_list.favorite_account .remote_account', function( e ) {
						var account = g_cmn.account[$( this ).attr( 'account_id' )];

						var url = item.find( '.status_url' ).attr( 'href' );

						SendRequest(
							{
								method: 'GET',
								action: 'api_call',
								instance: account.instance,
								access_token: account.access_token,
								api: 'search',
								param: {
									q: url,
								}
							},
							function( res )
							{
								if ( res.status === undefined )
								{
									if ( res.statuses.length > 0 )
									{
										Loading( true, 'remote_favorite' );

										SendRequest(
											{
												method: 'POST',
												action: 'api_call',
												instance: account.instance,
												access_token: account.access_token,
												api: 'statuses/' + res.statuses[0].id + '/favourite',
											},
											function( res )
											{
												if ( res.status === undefined )
												{
												}
												else
												{
													ApiError( res );
												}

												Loading( false, 'remote_favorite' );
											}
										);
									}
								}
								else
								{
									ApiError( res );
								}

								item.find( '.menubox .remote_account_list.favorite_account' ).hide();
								Loading( false, 'remote_favorite_search' );
							}
						);
						
						e.stopPropagation();
					} );
				}

				item.find( '.menubox' ).toggle();
			}
			////////////////////////////////////////
			// 返信ボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_reply' ) )
			{
				var item = targ.closest( '.item' );
				
				var pid = IsUnique( 'tootbox' );

				if ( pid == null )
				{
					var _cp = new CPanel( null, null, g_defwidth, g_defheight_s );
					_cp.SetType( 'tootbox' );
					_cp.SetParam( { account_id: cp.param['account_id'] } );
					_cp.Start( function() {
						$( '#' + _cp.id ).find( 'div.contents' ).trigger( 'setreply', [ cp.param['account_id'], item.attr( 'status_id' ) ] );
					} );
				}
				else
				{
					SetFront( $( '#' + pid ) );

					// 最小化している場合は元に戻す
					if ( GetPanel( pid ).minimum.minimum == true )
					{
						$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
					}

					$( '#' + pid ).find( 'div.contents' ).trigger( 'setreply', [ cp.param['account_id'], item.attr( 'status_id' ) ] );
				}
			}
			////////////////////////////////////////
			// ブーストボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_boost' ) )
			{
				// disabledなら処理しない
				if ( targ.hasClass( 'disabled' ) )
				{
					return;
				}

				var item = targ.closest( '.item' );

				var api = 'statuses/' + item.attr( 'status_id' );

				if ( targ.hasClass( 'on' ) )
				{
					api += '/unreblog';
				}
				else
				{
					api += '/reblog';
				}

				SendRequest(
					{
						method: 'POST',
						action: 'api_call',
						instance: g_cmn.account[cp.param['account_id']].instance,
						access_token: g_cmn.account[cp.param['account_id']].access_token,
						api: api,
					},
					function( res )
					{
						if ( res.status === undefined )
						{
							// off->on
							if ( res.reblogged )
							{
								targ.removeClass( 'off' ).addClass( 'on' );
							}
							// on->off
							else
							{
								targ.removeClass( 'on' ).addClass( 'off' );
							}
						}
						else
						{
							ApiError( res );
						}
					}
				);
			}
			////////////////////////////////////////
			// 削除ボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_del' ) )
			{
				var item = targ.closest( '.item' );
				
				if ( confirm( i18nGetMessage( 'i18n_0224' ) ) )
				{
					Blackout( true );
					Loading( true, 'delete_toot' );

					SendRequest(
						{
							method: 'DELETE',
							action: 'api_call',
							instance: g_cmn.account[cp.param['account_id']].instance,
							access_token: g_cmn.account[cp.param['account_id']].access_token,
							api: 'statuses/' + item.attr( 'status_id' ),
						},
						function( res )
						{
							if ( res.status === undefined )
							{
								item.fadeOut( 'fast', function() {
									delete status_ids[item.attr( 'status_id' ) + '@' + item.attr( 'instance' )];
									status_cnt--;
									$( this ).remove();

									StatusesCountUpdate( cp.param['account_id'], 1 );
								} );
							}
							else
							{
								ApiError( res );
							}

							Blackout( false );
							Loading( false, 'delete_toot' );
						}
					);
				}
			}
			////////////////////////////////////////
			// ☆クリック処理
			////////////////////////////////////////
			else if ( targ.hasClass( 'fav' ) )
			{
				var item = targ.closest( '.item' );

				var api = 'statuses/' + item.attr( 'status_id' );

				if ( targ.hasClass( 'on' ) )
				{
					api += '/unfavourite';
				}
				else
				{
					api += '/favourite';
				}

				SendRequest(
					{
						method: 'POST',
						action: 'api_call',
						instance: g_cmn.account[cp.param['account_id']].instance,
						access_token: g_cmn.account[cp.param['account_id']].access_token,
						api: api,
					},
					function( res )
					{
						if ( res.status === undefined )
						{
							// off->on
							if ( res.favourited )
							{
								targ.removeClass( 'off' ).addClass( 'on' );
							}
							// on->off
							else
							{
								targ.removeClass( 'on' ).addClass( 'off' );
							}
						}
						else
						{
							ApiError( res );
						}
					}
				);
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
		// リンクにカーソルを乗せたとき
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', '> div.item div.toot_text a.anchor.url', function( e ) {
			var anchor = $( this );
			var url = anchor.attr( 'href' );

			if ( e.type == 'mouseenter' )
			{
				// t.coを展開する
				if ( url.match( /^https:\/\/t\.co/ ) )
				{
					var _xhr = new XMLHttpRequest();
					_xhr.open( 'GET', url );
					_xhr.responseType = 'document';

					_xhr.onload = function( e ) {
						anchor.attr( 'href', _xhr.response.title ).html( _xhr.response.title );
					};

					_xhr.send();
				}
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
						mytoot: options.attr( 'mytoot' ),
						reblogged: options.attr( 'reblogged' ),
						type: cp.param['timeline_type'],
						visibility: $( this ).attr( 'visibility' ),
					} ) );
				}

				options.find( 'span.btns, span.fav' ).css( { display: 'inline-block' } );
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

		////////////////////////////////////////
		// 適用ボタンクリック処理
		////////////////////////////////////////
		setting.find( '.tlsetting_apply' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			if ( cp.param.timeline_type == 'notifications' )
			{
				cp.param.dn_new_followers = ( setting.find( '.dn_new_followers' ).prop( 'checked' ) ) ? 1 : 0;
				cp.param.dn_favourites = ( setting.find( '.dn_favourites' ).prop( 'checked' ) ) ? 1 : 0;
				cp.param.dn_mentions = ( setting.find( '.dn_mentions' ).prop( 'checked' ) ) ? 1 : 0;
				cp.param.dn_boosts = ( setting.find( '.dn_boosts' ).prop( 'checked' ) ) ? 1 : 0;
			}

			if ( cp.param.timeline_type != 'notifications' )
			{
				cp.param['tl_nsfw'] = setting.find( 'input[class=tl_nsfw]:checked' ).val();
			}

			setting.find( '.tlsetting_apply' ).addClass( 'disabled' );

			SaveData();

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

		if ( socket != null )
		{
			socket.close();
		}
	};
}
