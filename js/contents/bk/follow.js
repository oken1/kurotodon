"use strict";

////////////////////////////////////////////////////////////////////////////////
// follow/follower一覧表示
////////////////////////////////////////////////////////////////////////////////
Contents.follow = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var follow_list;
	var disp = 0; // (0.詳細 1.アイコン)
	var count = 0;
	var pos = 0;
	var scrollPos = null;
	var ids = new Array();

	cp.SetIcon( 'icon-users' );

	////////////////////////////////////////////////////////////
	// 表示形式を変更する
	////////////////////////////////////////////////////////////
	var DispChange = function() {
		var items = follow_list.find( 'div.item' );

		// 詳細
		if ( disp == 0 )
		{
			items.find( '.container' ).show()
				.end()
				.removeClass( 'icon_only' )
				.find( '.icon' ).removeClass( 'icon_only tooltip' );
		}
		// アイコン
		else
		{
			items.find( '.container' ).hide()
				.end()
				.addClass( 'icon_only' )
				.find( '.icon' ).addClass( 'icon_only tooltip' );
		}
	}

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		// lookup
		var Lookup = function() {
			if ( type == 'init' || type == 'reload' )
			{
				pos = 0;
			}

			if ( pos > ids.length - 1 )
			{
				return;
			}

			var param_ids = ids.slice( pos, pos + 100 );

			param = {
				type: 'POST',
				url: ApiUrl( '1.1' ) + 'users/lookup.json',
				data: {
					user_id: param_ids.join( ',' ),
					include_entities: false
				}
			};

			cont.activity( { color: '#ffffff' } );

			SendRequest(
				{
					action: 'oauth_send',
					acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
					acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
					param: param,
					id: cp.param['account_id'],
				},
				function( res )
				{
					if ( res.status == 200 )
					{
						var s = '';
						var json = res.json;
						var items = new Array();
						var len;
						var item;
						var created_at = '';

						len = json.length;
						pos += param_ids.length;

						var _json = {};

						for ( var i = 0 ; i < len ; i++ )
						{
							_json[json[i].id_str] = json[i];
						}

						for ( var j = 0, i, _len = param_ids.length ; j < _len ; j++ )
						{
							i = param_ids[j];

							if ( _json[i] == undefined )
							{
								continue;
							}

							// 日付にはとりあえずアカウントの作成日を設定
							created_at = _json[i].created_at;

							// 最新ツイートが設定されている場合は、そのツイートの日時を設定
							if ( _json[i].status != undefined )
							{
								if ( _json[i].status.created_at != undefined )
								{
									created_at = _json[i].status.created_at;
								}
							}

							var isfriend = IsFriend( cp.param['account_id'], _json[i].id_str );
							var isfollower = IsFollower( cp.param['account_id'], _json[i].id_str );

							item = {
								icon: _json[i].profile_image_url_https,
								screen_name: _json[i].screen_name,
								name: _json[i].name,
								follow: NumFormat( _json[i].friends_count ),
								follower: NumFormat( _json[i].followers_count ),
								count: NumFormat( _json[i].statuses_count ),
								verified: _json[i].verified,
								protected: _json[i].protected,
								user_id: _json[i].id_str,
								created_at: created_at,
								ismutual: isfriend & isfollower,
								isfriend: isfriend & !isfollower,
								isfollower: !isfriend & isfollower,
							};

							items.push( item );
						}

						s = OutputTPL( 'user_list', { items: items } );

						// もっと読む
						var AppendReadmore = function() {
							if ( pos < ids.length - 1 )
							{
								follow_list.append(
									'<div class="btn img readmore icon-arrow_down tooltip" tooltip="' + chrome.i18n.getMessage( 'i18n_0157' ) + '"></div>' );
							}
						};

						switch ( type )
						{
							// 初期、更新
							case 'init':
							case 'reload':
								follow_list.html( s )
									.scrollTop( 0 );

								AppendReadmore();
								break;
							// もっと読む
							case 'old':
								follow_list.append( s );

								AppendReadmore();

								follow_list.find( '.readmore:first' ).remove();
								$( '#tooltip' ).hide();

								break;
						}

						DispChange();
						cont.find( '.panel_btns' ).find( '.count' ).html( NumFormat( pos ) + ' / ' + cp.param['number'] );

						cont.trigger( 'contents_resize' );
					}
					else
					{
						// もっと読むで404が返ってきた場合
						if ( type == 'old' && res.status == 404 )
						{
							follow_list.find( '.readmore:first' ).remove();
							$( '#tooltip' ).hide();
						}
						else
						{
							ApiError( chrome.i18n.getMessage( 'i18n_0106',[( ( cp.param['type'] == 'friends' ) ? chrome.i18n.getMessage( 'i18n_0125' ) : chrome.i18n.getMessage( 'i18n_0122' ) )] ), res );

							if ( type == 'old' )
							{
								follow_list.find( '.readmore' ).removeClass( 'disabled' );
							}
						}
					}

					cont.activity( false );
					$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
				}
			);
		};

		// ids
		if ( type == 'init' || type == 'reload' )
		{
			ids = [];
			count = 0;

			var param = {
				type: 'GET',
				url: ApiUrl( '1.1' ) + cp.param['type'] + '/ids.json',
				data: {
					screen_name: cp.param['screen_name'],
					cursor: -1,
					stringify_ids: true
				}
			};

			cont.activity( { color: '#ffffff' } );

			SendRequest(
				{
					action: 'oauth_send',
					acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
					acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
					param: param,
					id: cp.param['account_id'],
				},
				function( res )
				{
					if ( res.status == 200 )
					{
						ids = res.json.ids;
						count = ids.length;
					}
					else
					{
						ApiError( chrome.i18n.getMessage( 'i18n_0106',[( ( cp.param['type'] == 'friends' ) ? chrome.i18n.getMessage( 'i18n_0125' ) : chrome.i18n.getMessage( 'i18n_0122' ) )] ), res );
					}

					cont.activity( false );

					$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );

					Lookup();
				}
			);
		}
		else
		{
			Lookup();
		}
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
				if ( scrollPos == null )
				{
					scrollPos = follow_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					follow_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '.follow_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
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
				ListMake( 'init' );
			}
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
		} );

		if ( !AccountAliveCheck() )
		{
			return;
		}

		// 全体を作成
		cont.addClass( 'follow' )
			.html( OutputTPL( 'follow', { number: cp.param['number'] } ) );

		follow_list = cont.find( '.follow_list' );

		var msg = chrome.i18n.getMessage( 'i18n_0098' ) + ( ( cp.param['type'] == 'friends' ) ? chrome.i18n.getMessage( 'i18n_0125' ) : chrome.i18n.getMessage( 'i18n_0122' ) );

		cp.SetTitle( cp.param['screen_name'] + msg + ' (<span class="titlename">' + g_cmn.account[cp.param['account_id']].screen_name + '</span>)', false );

		////////////////////////////////////////
		// ユーザ名クリック
		////////////////////////////////////////
		follow_list.on( 'click', $( '> div.item' ).find( '.screen_name' ).selector, function( e ) {
			OpenUserTimeline( $( this ).text(), cp.param['account_id'] );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンクリック処理
		////////////////////////////////////////
		follow_list.on( 'click', $( '> div.item' ).find( '.icon' ).find( 'img' ).selector, function( e ) {
			OpenUserShow( $( this ).parent().parent().attr( 'screen_name' ),
				$( this ).parent().parent().attr( 'user_id' ),
				cp.param['account_id'] );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// もっと読むクリック処理
		////////////////////////////////////////
		follow_list.on( 'click', $( '> div.readmore' ).selector, function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			$( this ).addClass( 'disabled' );

			ListMake( 'old' );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		////////////////////////////////////////
		follow_list.on( 'mouseenter mouseleave', $( '> div.item' ).find( 'div.icon' ).find( '> img' ).selector, function( e ) {
			if ( e.type == 'mouseenter' )
			{
				// Draggableの設定をする
				SetDraggable( $( this ), p, cp );
			}
			else
			{
				$( '#tooltip' ).hide();
			}
		} );

		////////////////////////////////////////
		// 更新ボタンクリック処理
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.follow_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			ListMake( 'reload' );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 表示形式ボタンクリック処理
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.disp' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			disp = 1 - disp;

			$( this ).html( ( disp == 0 ) ? chrome.i18n.getMessage( 'i18n_0041' ) : chrome.i18n.getMessage( 'i18n_0232' ) );

			DispChange();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 一番上へ
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.sctbl' ).find( 'a:first' ).click( function( e ) {
			follow_list.scrollTop( 0 );
		} );

		////////////////////////////////////////
		// 一番下へ
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.sctbl' ).find( 'a:last' ).click( function( e ) {
			follow_list.scrollTop( follow_list.prop( 'scrollHeight' ) );
		} );

		////////////////////////////////////////
		// 一番下までスクロールで
		// 「もっと読む」クリック
		////////////////////////////////////////
		follow_list.scroll(
			function()
			{
				if ( g_cmn.cmn_param['autoreadmore'] == 1 )
				{
					if ( follow_list.prop( 'scrollHeight' ) == follow_list.scrollTop() + follow_list.innerHeight() )
					{
						follow_list.find( '.readmore' ).trigger( 'click' );
					}
				}
			}
		);

		// リスト部作成処理
		ListMake( 'init' );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
