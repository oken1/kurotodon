"use strict";

////////////////////////////////////////////////////////////////////////////////
// 検索メモ一覧
////////////////////////////////////////////////////////////////////////////////
Contents.saved_search = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var scrollPos = null;

	cp.SetIcon( 'icon-search' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function() {
		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'saved_searches/list.json',
			data: {
			},
		};

		var items = new Array();

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
				g_cmn.account[cp.param['account_id']].notsave.saved_search = [];

				if ( res.status == 200 )
				{
					for ( var i = 0, _len = res.json.length ; i < _len ; i++ )
					{
						g_cmn.account[cp.param['account_id']].notsave.saved_search.push( res.json[i].query );

						items.push( {
							id: res.json[i].id_str,
							query: escapeHTML( res.json[i].query ),
						} );
					}

					cont.find( '.saved_search_list' ).html( OutputTPL( 'saved_search_list', { items: items } ) );

					// 検索パネルを開いている場合はプルダウン更新
					var pid = IsUnique( 'searchbox' );

					if ( pid != null )
					{
						$( '#' + pid ).find( 'div.contents' ).trigger( 'account_changed' );
					}

					cont.trigger( 'contents_resize' );

					////////////////////////////////////////
					// 削除ボタンクリック処理
					////////////////////////////////////////
					cont.find( '.saved_search_list' ).find( 'div.item .delbtn' ).click( function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var query = $( this ).parent().parent().find( '.query' );

						var conf = confirm( chrome.i18n.getMessage( 'i18n_0185', [query.attr( 'query' )] ) );

						if ( conf )
						{
							var param = {
								type: 'POST',
								url: ApiUrl( '1.1' ) + 'saved_searches/destroy/' + query.attr( 'sid' ) + '.json',
								data: {
								},
							};

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
										ListMake();
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

						e.stopPropagation();
					} );
				}
				else
				{
					ApiError( chrome.i18n.getMessage( 'i18n_0209' ), res );
				}

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
				cont.activity( false );
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
					scrollPos = cont.find( '.saved_search_list' ).scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					cont.find( '.saved_search_list' ).scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '.saved_search_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
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
		cont.addClass( 'saved_search' )
			.html( OutputTPL( 'saved_search', {} ) );

		cp.SetTitle( g_cmn.account[cp.param['account_id']].screen_name + 'の' + chrome.i18n.getMessage( 'i18n_0207' ), false );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.saved_search_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			ListMake();
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
