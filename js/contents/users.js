"use strict";

////////////////////////////////////////////////////////////////////////////////
// ユーザ検索一覧
////////////////////////////////////////////////////////////////////////////////
Contents.users = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var users_list;
	var scrollPos = null;
	var users = {};
	var limit = 80;
	var first_id = null;
	
	cp.SetIcon( 'icon-users2' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		var param = {};
		
		switch ( cp.param.users_type )
		{
			case 'follows':
				param = {
					api: 'accounts/' + cp.param.id + '/following',
					data: {
						limit: limit
					}
				};
				
				break;
			case 'followers':
				param = {
					api: 'accounts/' + cp.param.id + '/followers',
					data: {
						limit: limit
					}
				};
				
				break;
		}

		switch( type )
		{
			// 初期
			case 'init':
				break;
			// 更新
			case 'reload':
				break;
			// もっと読む
			case 'old':
				param.data.max_id = first_id;
				break;
		}

		Loading( true, 'users' );

		SendRequest(
			{
				method: 'GET',
				action: 'api_call',
				instance: g_cmn.account[cp.param.account_id].instance,
				access_token: g_cmn.account[cp.param.account_id].access_token,
				api: param.api,
				param: param.data
			},
			function( res )
			{
			console.log( res );
				if ( res.status === undefined )
				{
					var s = '';
					var items = new Array();
					var len = res.length;

					for ( var i = 0 ; i < len ; i++ )
					{
						var instance = GetInstanceFromAcct( res[i].acct, cp.param.account_id );

						users[res[i].id + '@' + instance] = true;

						items.push( {
							avatar: ImageURLConvert( res[i].avatar, res[i].acct, cp.param.account_id ),
							display_name: res[i].display_name,
							username: res[i].username,
							instance: instance,
							id: res[i].id,
							statuses_count: NumFormat( res[i].statuses_count ),
							following_count: NumFormat( res[i].following_count ),
							followers_count: NumFormat( res[i].followers_count ),
							created_at: res[i].created_at,
						} );
					}

					s = OutputTPL( 'users_list', { items: items } );

					if ( len > 0 )
					{
						if ( type == 'init' || type == 'reload' || type == 'old' )
						{
							first_id = res[len - 1].id;
						}
					}

					// もっと読む
					var AppendReadmore = function() {
						if ( len > 0 )
						{
							users_list.append(
								'<div class="btn img readmore icon-arrow_down tooltip" tooltip="' + i18nGetMessage( 'i18n_0157' ) + '"></div>' );
						}
					};

					switch ( type )
					{
						// 初期、更新
						case 'init':
						case 'reload':
							users_list.html( s );
							users_list.scrollTop( 0 );
							AppendReadmore();
							break;
						// もっと読む
						case 'old':
							if ( len > 0 )
							{
								users_list.append( s );
								AppendReadmore();
							}

							users_list.find( '.readmore:first' ).remove();
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
						users_list.find( '.readmore:first' ).remove();
						$( '#tooltip' ).hide();
					}
					else
					{
						ApiError( res );
					}
				}

				Loading( false, 'users' );
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
					scrollPos = users_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					users_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '.users_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
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

		if ( !AccountAliveCheck() )
		{
			return;
		}

		// 全体を作成
		cont.addClass( 'users' )
			.html( OutputTPL( 'users', {} ) );

		users_list = cont.find( '.users_list' );

		// タイトル設定
		var account = g_cmn.account[cp.param['account_id']];

		switch ( cp.param['users_type'] )
		{
			case 'follows':
				cp.SetTitle( cp.param.display_name + ' ' + i18nGetMessage( 'i18n_0399' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
				cp.SetIcon( 'icon-users-plus' );
				break;
			case 'followers':
				cp.SetTitle( cp.param.display_name + ' ' + i18nGetMessage( 'i18n_0400' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
				cp.SetIcon( 'icon-users-plus' );
				break;
		}

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.users_reload' ).click( function( e ) {
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
		users_list.on( 'click', '> div.item .display_name, > div.item .username', function( e ) {
			var item = $( this ).closest( '.item' );

			console.log( cp.param.account_id);
			console.log( item.attr( 'id' ));
			console.log( item.attr( 'username' ));
			console.log( item.attr( 'display_name' ));
			console.log( item.attr( 'instance' ) );

			OpenUserTimeline( cp.param.account_id, item.attr( 'id' ), item.attr( 'username' ),
				item.attr( 'display_name' ), item.attr( 'instance' ) );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// もっと読むクリック処理
		////////////////////////////////////////
		users_list.on( 'click', '> div.readmore', function( e ) {
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
		users_list.on( 'mouseenter mouseleave', '> div.item div.avatar > img', function( e ) {
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

		// リスト部作成処理
		ListMake( 'init' );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
