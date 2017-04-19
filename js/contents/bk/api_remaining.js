"use strict";

////////////////////////////////////////////////////////////////////////////////
// API残数
////////////////////////////////////////////////////////////////////////////////
Contents.api_remaining = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var scrollPos = null;

	cp.SetIcon( 'icon-twitter' );

	// API1.1対応済み
	var apis = {};
	apis['/statuses/home_timeline'] = { title: chrome.i18n.getMessage( 'i18n_0152' ), prio: 0 };
	apis['/statuses/mentions_timeline'] = { title: chrome.i18n.getMessage( 'i18n_0026' ), prio: 1 };
	apis['/lists/statuses'] = { title: chrome.i18n.getMessage( 'i18n_0167' ), prio: 2 };
	apis['/statuses/user_timeline'] = { title: chrome.i18n.getMessage( 'i18n_0291' ), prio: 3 };
	apis['/direct_messages'] = { title: chrome.i18n.getMessage( 'i18n_0021' ), prio: 4 };
	apis['/search/tweets'] = { title: chrome.i18n.getMessage( 'i18n_0206' ), prio: 5 };
	apis['/users/show/:id'] = { title: chrome.i18n.getMessage( 'i18n_0292' ), prio: 6 };
	apis['/statuses/show/:id'] = { title: chrome.i18n.getMessage( 'i18n_0293' ), prio: 7 };
	apis['/users/search'] = { title: chrome.i18n.getMessage( 'i18n_0159' ), prio: 8 };
	apis['/lists/list'] = { title: chrome.i18n.getMessage( 'i18n_0294' ), prio: 9 };
	apis['/direct_messages/sent'] = { title: chrome.i18n.getMessage( 'i18n_0251' ), prio: 10 };
	apis['/favorites/list'] = { title: chrome.i18n.getMessage( 'i18n_0054' ), prio: 11 };
	apis['/trends/place'] = { title: chrome.i18n.getMessage( 'i18n_0095' ), prio: 12 };
	apis['/trends/available'] = { title: chrome.i18n.getMessage( 'i18n_0295' ), prio: 13 };
	apis['/saved_searches/list'] = { title: chrome.i18n.getMessage( 'i18n_0207' ), prio: 14 };
	apis['/users/lookup'] = { title: chrome.i18n.getMessage( 'i18n_0316' ), prio: 15 };
	apis['/application/rate_limit_status'] = { title: chrome.i18n.getMessage( 'i18n_0296' ), prio: 16 };
	apis['/blocks/ids'] = { title: chrome.i18n.getMessage( 'i18n_0318' ), prio: 17 };
	apis['/friends/ids'] = { title: chrome.i18n.getMessage( 'i18n_0319' ), prio: 18 };
	apis['/followers/ids'] = { title: chrome.i18n.getMessage( 'i18n_0320' ), prio: 19 };
	apis['/friendships/incoming'] = { title: chrome.i18n.getMessage( 'i18n_0321' ), prio: 20 };
	apis['/friendships/no_retweets/ids'] = { title: chrome.i18n.getMessage( 'i18n_0326' ), prio: 21 };
	apis['/help/configuration'] = { title: chrome.i18n.getMessage( 'i18n_0297' ), prio: 22 };

	var apis_length = 0;

	for ( var api in apis )
	{
		apis_length++;
	}

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function() {
		var account = g_cmn.account[cp.param['account_id']];
		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'application/rate_limit_status.json',
			data: {
				resources: 'account,application,blocks,direct_messages,favorites,followers,friends,friendships,geo,help,lists,saved_searches,search,statuses,trends,users,friends,followers',
			},
		};

		cont.activity( { color: '#ffffff' } );

		SendRequest(
			{
				action: 'oauth_send',
				acsToken: account.accessToken,
				acsSecret: account.accessSecret,
				param: param,
				id: cp.param['account_id']
			},
			function( res )
			{
				var items = new Array( apis_length );
				var dt;

				if ( res.status == 200 )
				{
					for ( var resource in res.json.resources )
					{
						for ( var api in res.json.resources[resource] )
						{
							if ( apis[api] != undefined )
							{
								dt = new Date();
								dt.setTime( res.json.resources[resource][api]['reset'] * 1000 );

								items[apis[api].prio] = {
									api: api,
									title: apis[api].title,
									remaining: res.json.resources[resource][api]['remaining'],
									limit: res.json.resources[resource][api]['limit'],
									reset: ( '00' + dt.getHours() ).slice( -2 ) + ':' +
											( '00' + dt.getMinutes() ).slice( -2 ) + ':' +
											( '00' + dt.getSeconds() ).slice( -2 ),
									per: Math.floor( res.json.resources[resource][api]['remaining'] / res.json.resources[resource][api]['limit'] * 100 ),
									reltime: DateConv( dt.toGMTString().replace( 'GMT', '+0000' ), 2 )
								};
							}
						}
					}

					cont.find( '.api_remaining_list' ).html( OutputTPL( 'api_remaining_list', { items: items } ) );

					for ( var i = 0, item, n = 0, _len = items.length ; i < _len ; i++ )
					{
						if ( items[i] == undefined )
						{
							continue;
						}

						item = cont.find( '.api_remaining_list' ).find( '.item:eq(' + n + ')' );
						n++;

						item.find( '.used' ).css( {
							width: 100 - items[i].per + '%',
							left: items[i].per + '%',
						} );
					}

					cont.trigger( 'contents_resize' ).activity( false );
				}
				else
				{
					ApiError( chrome.i18n.getMessage( 'i18n_0298' ), res );
					cont.activity( false );
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
					scrollPos = cont.find( '.api_remaining_list' ).scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					cont.find( '.api_remaining_list' ).scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '.api_remaining_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
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
				ListMake();
			}
		} );

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

		////////////////////////////////////////
		// API残数変更
		////////////////////////////////////////
		cont.on( 'api_remaining_update', function( e, id ) {
			if ( id == cp.param['account_id'] )
			{
				ListMake();
			}
		} );

		// 全体を作成
		cont.addClass( 'api_remaining' )
			.html( OutputTPL( 'api_remaining', {} ) );

		cp.SetTitle( chrome.i18n.getMessage( 'i18n_0296' ) + ' (<span class="titlename">' + g_cmn.account[cp.param['account_id']].screen_name + '</span>)', false );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.api_remaining_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			ListMake();

			e.stopPropagation();
		} );

		// リスト部作成処理
		ListMake();
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
