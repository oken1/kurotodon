"use strict";

////////////////////////////////////////////////////////////////////////////////
// タイムライン表示(インスタンス覗き見用)
////////////////////////////////////////////////////////////////////////////////
Contents.peeptimeline = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var lines = cont.find( '.lines' );
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
	var active_users = {};

	////////////////////////////////////////////////////////////
	// 一覧作成
	////////////////////////////////////////////////////////////
	var ListMake = function( count, type ) {
		var param = {};

		switch ( cp.param['timeline_type'] )
		{
			case 'peep':
				param = {
					api: 'timelines/public',
					data: {
						local: true,
						limit: count
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

		Loading( true, 'peeptimeline' );

		// API呼び出し
		SendRequest(
			{
				method: 'GET',
				action: 'api_call',
				instance: cp.param.instance,
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

						len = res.length;

						for ( var i = 0 ; i < len ; i++ )
						{
							var instance = cp.param.instance;

							if ( status_ids[res[i].id + '@' + instance] == undefined )
							{
								s += MakePeepTimeline( res[i], cp );

								status_ids[res[i].id + '@' + instance] = true;
								status_cnt++;

								active_users[res[i].account.id + '@' + instance] = true;

								addcnt++;
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
									items = newitems;

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
								var itemcnt = timeline_list.find( '> div.item:not(".res")' ).length;

								if ( addcnt > 0 )
								{
									timeline_list.append( s );

									AppendReadmore();
								}

								timeline_list.find( '.readmore' ).first().remove();
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
							timeline_list.find( '.readmore' ).fist().remove();
							$( '#tooltip' ).hide();
						}
						else
						{
							ApiError( res );
						}
					}

					Loading( false, 'peeptimeline' );
				};

				_maketimeline( res );
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
				if ( scrollPos != null && scrollHeight != null )
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
		} );

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

		// 全体を作成
		cont.addClass( 'timeline' );
		lines.html( OutputTPL( 'timeline', { type: cp.param['timeline_type'] } ) );

		cont.find( '.setting' ).remove();
		
		/* インスタンス情報 */
		$.ajax( {
			type: 'GET',
			url: 'https://' + cp.param.instance + '/about/more',
			dataType: 'html',
		} ).done( function( data ) {
			var _j = $( data );

			lines.find( '.instance_info_window .users' ).html( _j.find( '.information-board > .section' ).eq(0).find( '> strong' ).text() );
			lines.find( '.instance_info_window .statuses' ).html( _j.find( '.information-board > .section' ).eq(1).find( '> strong' ).text() );

			SendRequest(
				{
					method: 'GET',
					action: 'api_call',
					instance: cp.param.instance,
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

		// タイムラインを表示
		lines.show();

		timeline_list = lines.find( '.timeline_list' );

		cont.find( '.panel_btns' ).find( '.clear_notification' ).hide();

		switch ( cp.param['timeline_type'] )
		{
			case 'peep':
				cp.SetTitle( cp.param.instance, false );
				cp.SetIcon( 'icon-users2' );
				cont.find( '.panel_btns' ).find( '.streamctl' ).hide();
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
			// タイマーを止める
			if ( tm != null )
			{
				clearInterval( tm );
				tm = null;
			}

			tm = setInterval( function() {
				ListMake( cp.param['get_count'], 'new' );
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
		// クリックイベント
		////////////////////////////////////////
		timeline_list.click( function( e ) {
			var targ = $( e.target );
			var ptarg = targ.parent();

			if ( targ.hasClass( 'anchor' ) )
			{
				if ( targ.hasClass( 'url' ) )
				{
					var url = targ.attr( 'href' );
					window.open( url, '_blank' );
					return false;
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
						toolbaruser: false, type: 'peep',
					} ) );

					var menubox = item.find( 'div.toot' ).find( 'div.menubox' );

					// リモートフォロー
					menubox.find( '> a.remotefollow' ).on( 'click', function( e ) {
						var account_list = item.find( '.menubox .remote_account_list' );

						if ( account_list.css( 'display' ) == 'none' )
						{
							var s = '';

							for ( var i = 0 ; i < g_cmn.account_order.length ; i++ )
							{
								var id = g_cmn.account_order[i];

								s += '<div class="remote_account">' +
									 '<span>' + g_cmn.account[id].display_name + '</span>' +
									 '<span>@' + g_cmn.account[id].instance + '</span>' +
									 '</div>';
							}
							account_list.show().html( s );
						}
						else
						{
							account_list.hide();
						}

						e.stopPropagation();
					} );

					menubox.on( 'click', '> .remote_account_list .remote_account', function( e ) {
						var account = g_cmn.account[g_cmn.account_order[$( this ).index()]];

						var uri = item.attr( 'username' ) + '@' + item.attr( 'instance' );

						Loading( true, 'remotefollow' );

						SendRequest(
							{
								method: 'POST',
								action: 'api_call',
								instance: account.instance,
								access_token: account.access_token,
								api: 'follows',
								param: {
									uri: item.attr( 'username' ) + '@' + item.attr( 'instance' )
								}
							},
							function( res )
							{
								console.log( res )

								if ( res.status === undefined )
								{
								}
								else
								{
									ApiError( res );
								}

								item.find( '.menubox .remote_account_list' ).hide();
								Loading( false, 'remotefollow' );
							}
						);

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
		// アイコンにカーソルを乗せたとき
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', '> div.item div.avatar > img', function( e ) {
			if ( e.type == 'mouseenter' )
			{
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
						mytoot: options.attr( 'mytoot' ),
						reblogged: options.attr( 'reblogged' ),
						type: cp.param['timeline_type'],
						visibility: $( this ).attr( 'visibility' ),
					} ) );
				}

				options.find( 'span.btns' ).css( { display: 'inline-block' } );
			}
			else
			{
				options.find( 'span.btns' ).css( { display: 'none' } );
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

	////////////////////////////////////////////////////////////////////////////////
	// タイムライン作成(インスタンス覗き見用)
	////////////////////////////////////////////////////////////////////////////////
	function MakePeepTimeline( json, cp )
	{
		var notification = null;

		var bt_flg = ( json.reblog );
		var bt_id = json.account.id;
		var bt_instance = GetInstanceFromAcct( json.account.acct, cp.param.instance );
		var bt_display_name = json.account.display_name;
		var bt_username = json.account.username;
		var bt_avatar = ImageURLConvert( json.account.avatar, json.account.acct, cp.param.instance );

		if ( bt_flg )
		{
			var _json = json.reblog;
			json = _json;
		}

		var instance = GetInstanceFromAcct( json.account.acct, cp.param.instance );

		var assign = {
			id: json.account.id,
			status_id: json.id,
			created_at: json.created_at,

			avatar: ImageURLConvert( json.account.avatar, json.account.acct, cp.param.instance ),
			statuses_count: NumFormat( json.account.statuses_count ),
			following: NumFormat( json.account.following_count ),
			followers: NumFormat( json.account.followers_count ),

			bt_flg: bt_flg,

			bt_id: bt_id,
			bt_instance: bt_instance,
			bt_display_name: bt_display_name,
			bt_username: bt_username,
			bt_avatar: bt_avatar,

			visibility: json.visibility,

			display_name: json.account.display_name,
			username: json.account.username,
			instance: instance,
			acct: json.account.acct,
			application: json.application,

			btcnt: json.reblogs_count,
			favcnt: json.favourites_count,

			date: DateConv( json.created_at, 0 ),
			dispdate: DateConv( json.created_at, 3 ),

			spoiler_text: json.spoiler_text,
			text: ConvertContent( json.content, json ),

			url : json.url,

			favourited: json.favourited,
			reblogged: json.reblogged,

			notification: notification,
		};

		return OutputTPL( 'timeline_toot', assign );
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
