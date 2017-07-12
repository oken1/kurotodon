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

	////////////////////////////////////////////////////////////
	// タイトル設定
	////////////////////////////////////////////////////////////
	var SetTitle = function()
	{
		var account = g_cmn.account[cp.param['account_id']];

		switch ( cp.param['users_type'] )
		{
			case 'follows':
				cp.SetTitle( cp.param.display_name + ' ' + i18nGetMessage( 'i18n_0399' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
				cp.SetIcon( 'icon-user-plus' );
				break;
			case 'followers':
				cp.SetTitle( cp.param.display_name + ' ' + i18nGetMessage( 'i18n_0400' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
				cp.SetIcon( 'icon-user-plus' );
				break;
			case 'muteusers':
				cp.SetTitle( i18nGetMessage( 'i18n_0401' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
				cp.SetIcon( 'icon-volume-mute2' );
				break;
			case 'blockusers':
				cp.SetTitle( i18nGetMessage( 'i18n_0402' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
				cp.SetIcon( 'icon-eye-blocked' );
				break;
		}
	};

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
			case 'muteusers':
				param = {
					api: 'mutes',
					data: {
						limit: limit
					}
				};
				
				break;
			case 'blockusers':
				param = {
					api: 'blocks',
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
				if ( res.status === undefined )
				{
					var s = '';
					var items = [];
					var len = res.length;
					var ids = [];

					for ( var i = 0 ; i < len ; i++ )
					{
						var instance = GetInstanceFromAcct( res[i].acct, g_cmn.account[cp.param.account_id].instance );

						users[res[i].id + '@' + instance] = true;
						ids.push( res[i].id );

						items.push( {
							avatar: ImageURLConvert( res[i].avatar, res[i].acct, g_cmn.account[cp.param.account_id].instance ),
							display_name: ( res[i].display_name ) ? res[i].display_name : res[i].username,
							username: res[i].username,
							instance: instance,
							id: res[i].id,
							statuses_count: NumFormat( res[i].statuses_count ),
							following_count: NumFormat( res[i].following_count ),
							followers_count: NumFormat( res[i].followers_count ),
							created_at: res[i].created_at,
							users_type: cp.param.users_type,
						} );
					}

					s = OutputTPL( 'users_list', { items: items } );

					if ( len > 0 )
					{
						first_id = null;

						if ( type == 'init' || type == 'reload' || type == 'old' )
						{
							if ( res.max_id )
							{
								first_id = res.max_id;
							}
						}
					}

					// もっと読む
					var AppendReadmore = function() {
						if ( first_id )
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

							users_list.find( '.readmore' ).first().remove();
							$( '#tooltip' ).hide();

							break;
					}

					cont.trigger( 'contents_resize' );

					Loading( false, 'users' );

					if ( len > 0 )
					{
						var q = '?';

						for ( var i = 0 ; i < ids.length ; i++ )
						{
							q += 'id[]=' + ids[i] + '&';
						}

						Loading( true, 'users_relationships' );

						SendRequest(
							{
								method: 'GET',
								action: 'api_call',
								instance: g_cmn.account[cp.param.account_id].instance,
								api: 'accounts/relationships' + q.replace( /&$/, '' ),
								access_token: g_cmn.account[cp.param.account_id].access_token,
							},
							function( res )
							{
								if ( res.status === undefined )
								{
									for ( var i = 0 ; i < res.length ; i++ )
									{
										if ( ( cp.param.users_type == 'follows' && res[i].following ) ||
											 ( cp.param.users_type == 'followers' && res[i].following ) ||
											 ( cp.param.users_type == 'muteusers' && res[i].muting ) ||
											 ( cp.param.users_type == 'blockusers' && res[i].blocking ) )
										{
											cont.find( '.item[id="' + res[i].id + '"] > .relationships > span' ).addClass( 'on' );
										}
									}

									cont.find( '.relationships > span' ).on( 'click', function( e ) {
										var item = $( this ).closest( '.item' );
										var api = 'accounts/' + item.attr( 'id' ) + '/';
										
										if ( $( this ).hasClass( 'on' ) )
										{
											if ( cp.param.users_type == 'follows' ) api += 'unfollow';
											if ( cp.param.users_type == 'followers' ) api += 'unfollow';
											if ( cp.param.users_type == 'muteusers' ) api += 'unmute';
											if ( cp.param.users_type == 'blockusers' ) api += 'unblock';
										}
										else
										{
											if ( cp.param.users_type == 'follows' ) api += 'follow';
											if ( cp.param.users_type == 'followers' ) api += 'follow';
											if ( cp.param.users_type == 'muteusers' ) api += 'mute';
											if ( cp.param.users_type == 'blockusers' ) api += 'block';
										}
									
										Loading( true, 'users_follow' );
										
										SendRequest(
											{
												method: 'POST',
												action: 'api_call',
												instance: g_cmn.account[cp.param.account_id].instance,
												api: api,
												access_token: g_cmn.account[cp.param.account_id].access_token,
											},
											function( res )
											{
												if ( res.status === undefined )
												{
													if ( ( cp.param.users_type == 'follows' && res.following ) ||
														 ( cp.param.users_type == 'followers' && res.following ) ||
														 ( cp.param.users_type == 'muteusers' && res.muting ) ||
														 ( cp.param.users_type == 'blockusers' && res.blocking ) )
													{
														item.find( '> .relationships > span' ).addClass( 'on' );
													}
													else
													{
														item.find( '> .relationships > span' ).removeClass( 'on' );
													}
												}
												else
												{
													ApiError( res );
												}

												Loading( false, 'users_follow' );
											}
										);
									} );
									
									Loading( false, 'users_relationships' );
								}
								else
								{
									ApiError( res );
									
									Loading( false, 'users_relationships' );
								}
							}
						);
					}
				}
				else
				{
					// もっと読むで404が返ってきた場合
					if ( type == 'old' && res.status == 404 )
					{
						users_list.find( '.readmore' ).first().remove();
						$( '#tooltip' ).hide();
					}
					else
					{
						ApiError( res );
					}

					Loading( false, 'users' );
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
			if ( AccountAliveCheck() )
			{
				SetTitle();
			}
		} );

		if ( !AccountAliveCheck() )
		{
			return;
		}

		// 全体を作成
		cont.addClass( 'users' )
			.html( OutputTPL( 'users', {} ) );

		users_list = cont.find( '.users_list' );

		SetTitle();
		
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

			OpenUserTimeline( cp.param.account_id, item.attr( 'id' ), item.attr( 'username' ),
				item.attr( 'display_name' ), item.attr( 'instance' ) );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンクリック
		////////////////////////////////////////
		users_list.on( 'click', '> div.item .avatar', function( e ) {
			var item = $( this ).closest( '.item' );

			OpenUserProfile( item.attr( 'id' ), item.attr( 'instance' ), cp.param.account_id );

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
