"use strict";

////////////////////////////////////////////////////////////////////////////////
// ユーザ検索一覧
////////////////////////////////////////////////////////////////////////////////
Contents.usersearch = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var page = 1;
	var usersearch_list;
	var scrollPos = null;
	var users = {};

	cp.SetIcon( 'icon-search' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'users/search.json',
			data: {
				q: cp.param['q'],
				count: 20,
				page: page,
			},
		};

		if ( type == 'init' || type == 'reload' )
		{
			param.data.page = 1;
		}

		cont.activity( { color: '#ffffff' } );

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
					var s = '';
					var json = res.json;
					var items = new Array();
					var len = 0;
					var created_at = '';

					for ( var i = 0, _len = json.length ; i < _len ; i++ )
					{
						if ( users[json[i].id_str] )
						{
							continue;
						}
						else
						{
							len++;
							users[json[i].id_str] = true;
						}

						// 日付にはとりあえずアカウントの作成日を設定
						created_at = json[i].created_at;

						// 最新ツイートが設定されている場合は、そのツイートの日時を設定
						if ( json[i].status != undefined )
						{
							if ( json[i].status.created_at != undefined )
							{
								created_at = json[i].status.created_at;
							}
						}

						var isfriend = IsFriend( cp.param['account_id'], json[i].id_str );
						var isfollower = IsFollower( cp.param['account_id'], json[i].id_str );

						items.push( {
							icon: json[i].profile_image_url_https,
							screen_name: json[i].screen_name,
							name: json[i].name,
							follow: NumFormat( json[i].friends_count ),
							follower: NumFormat( json[i].followers_count ),
							count: NumFormat( json[i].statuses_count ),
							description: json[i].description,
							verified: json[i].verified,
							protected: json[i].protected,
							user_id: json[i].id_str,
							created_at: created_at,
							ismutual: isfriend & isfollower,
							isfriend: isfriend & !isfollower,
							isfollower: !isfriend & isfollower,
						} );
					}

					s = OutputTPL( 'user_list', { items: items } );

					// もっと読む
					var AppendReadmore = function() {
						if ( len > 0 )
						{
							usersearch_list.append(
								'<div class="btn img readmore icon-arrow_down tooltip" tooltip="' + chrome.i18n.getMessage( 'i18n_0157' ) + '"></div>' );
						}
					};

					switch ( type )
					{
						// 初期、更新
						case 'init':
						case 'reload':
							usersearch_list.html( s );
							usersearch_list.scrollTop( 0 );

							page++;
							AppendReadmore();
							break;
						// もっと読む
						case 'old':
							if ( len > 0 )
							{
								usersearch_list.append( s );

								page++;
								AppendReadmore();
							}

							usersearch_list.find( '.readmore:first' ).remove();
							$( '#tooltip' ).hide();

							break;
					}

					cont.trigger( 'contents_resize' );
				}
				else
				{
					// もっと読むで404が返ってきた場合
					if ( type == 'old' && res.status == 404 )
					{
						usersearch_list.find( '.readmore:first' ).remove();
						$( '#tooltip' ).hide();
					}
					else
					{
						ApiError( chrome.i18n.getMessage( 'i18n_0213' ), res );

						if ( type == 'old' )
						{
							usersearch_list.find( '.readmore' ).removeClass( 'disabled' );
						}
					}
				}

				cont.activity( false );

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
				if ( scrollPos == null )
				{
					scrollPos = usersearch_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					usersearch_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '.usersearch_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
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
				cont.find( '.panel_btns' ).find( '.usersearch_reload' ).trigger( 'click' );
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
		cont.addClass( 'usersearch' )
			.html( OutputTPL( 'usersearch', {} ) );

		usersearch_list = cont.find( '.usersearch_list' );

		cp.SetTitle( chrome.i18n.getMessage( 'i18n_0105', [cp.param['q']] ) + ' (<span class="titlename">' + g_cmn.account[cp.param['account_id']]['screen_name'] + '</span>)', false );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.usersearch_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			ListMake( 'reload' );
		} );

		////////////////////////////////////////
		// ユーザ名クリック
		////////////////////////////////////////
		usersearch_list.on( 'click', $( '> div.item' ).find( '.screen_name' ).selector, function( e ) {
			OpenUserTimeline( $( this ).text(), cp.param['account_id'] );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンクリック処理
		////////////////////////////////////////
		usersearch_list.on( 'click', $( '> div.item' ).find( '.icon' ).find( 'img' ).selector, function( e ) {
			OpenUserShow( $( this ).parent().parent().attr( 'screen_name' ),
				$( this ).parent().parent().attr( 'user_id' ),
				cp.param['account_id'] );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// もっと読むクリック処理
		////////////////////////////////////////
		usersearch_list.on( 'click', $( '> div.readmore' ).selector, function( e ) {
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
		usersearch_list.on( 'mouseenter mouseleave', $( '> div.item' ).find( 'div.icon' ).find( '> img' ).selector, function( e ) {
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
		// 一番下までスクロールで
		// 「もっと読む」クリック
		////////////////////////////////////////
		usersearch_list.scroll(
			function()
			{
				if ( g_cmn.cmn_param['autoreadmore'] == 1 )
				{
					if ( usersearch_list.prop( 'scrollHeight' ) == usersearch_list.scrollTop() + usersearch_list.innerHeight() )
					{
						usersearch_list.find( '.readmore' ).trigger( 'click' );
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
