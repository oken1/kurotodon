"use strict";

////////////////////////////////////////////////////////////////////////////////
// リスト一覧
////////////////////////////////////////////////////////////////////////////////
Contents.lists = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var scrollPos = null;

	cp.SetIcon( 'icon-list' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function() {
		var list_items = new Array();

		cont.find( '.panel_btns' ).find( '.lists_edit' ).addClass( 'disabled' )
			.end()
			.find( '.lists_del' ).addClass( 'disabled' )
			.end()
			.attr( { screen_name: '', slug: '' } );

		var account = g_cmn.account[cp.param['account_id']];

		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'lists/list.json',
			data: {
				screen_name: account.screen_name,
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
				if ( res.status == 200 )
				{
					for ( var i = 0, _len = res.json.length ; i < _len ; i++ )
					{
						res.json[i].mylist = ( res.json[i].user.screen_name == account.screen_name ) ? 0 : 1;

						res.json[i].toolbarlist = ( IsToolbarList( res.json[i].id_str ) != -1 ) ? true : false;

						list_items.push( res.json[i] );

						// ツールバーリストの情報更新
						for ( var j = 0, __len = g_cmn.toolbar_user.length ; j < __len ; j++ )
						{
							if ( g_cmn.toolbar_user[j].type != 'list' )
							{
								continue;
							}

							if ( g_cmn.toolbar_user[j].list_id == res.json[i].id_str )
							{
								g_cmn.toolbar_user[j].owner_screen_name = res.json[i].user.screen_name;
								g_cmn.toolbar_user[j].slug = res.json[i].slug;
								g_cmn.toolbar_user[j].name = res.json[i].name;
							}
						}
					}

					UpdateToolbarUser();

					// 自作⇔購読順序入れ替え
					list_items.reverse();

					// アカウントごとのリスト情報を最新状態に更新
					account.lists = new Array();

					for ( var i = 0, _len = list_items.length ; i < _len ; i++ )
					{
						if ( list_items[i].mylist == 0 )
						{
							account.lists.push( {
								id_str: list_items[i].id_str,
								slug: list_items[i].slug,
								name: list_items[i].name,
								mode: list_items[i].mode,
							} );
						}
					}

					cont.find( '.lists_list' ).html( OutputTPL( 'lists_list', { items: list_items } ) )
						.end()
						.trigger( 'contents_resize' )
						.activity( false );

					////////////////////////////////////////
					// アイコンクリック処理
					////////////////////////////////////////
					cont.find( '.lists_list' ).find( '.item' ).find( '.icon' ).find( 'img' ).click( function( e ) {
						OpenUserShow( $( this ).parent().parent().attr( 'screen_name' ),
							$( this ).parent().parent().attr( 'user_id' ),
							cp.param['account_id'] );

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// リスト名クリック処理
					////////////////////////////////////////
					cont.find( '.lists_list' ).find( '.item' ).find( '.fullname' ).find( 'span:first-child' ).click( function( e ) {
						var fullname = $( this ).parent();

						var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75 );
						_cp.SetType( 'timeline' );
						_cp.SetParam( {
							account_id: cp.param['account_id'],
							timeline_type: 'list',
							screen_name: fullname.attr( 'screen_name' ),
							slug: fullname.attr( 'slug' ),
							name: fullname.attr( 'name' ),
							reload_time: g_cmn.cmn_param['reload_time'],
						} );
						_cp.Start();

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// ツールバーに登録ボタンクリック処理
					////////////////////////////////////////
					cont.find( '.lists_list' ).find( '.item' ).find( '.toolbarlist' ).click( function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var item = $( this ).parent().parent();

						var idx = IsToolbarList( item.attr( 'list_id' ) );

						// 登録
						if ( idx == -1 )
						{
							g_cmn.toolbar_user.push( {
								type: 'list',
								user_id: item.attr( 'user_id' ),
								screen_name: item.attr( 'screen_name' ),
								icon: item.find( '.icon img' ).attr( 'src' ),
								account_id: cp.param['account_id'],
								list_id: item.attr( 'list_id' ),
								owner_screen_name: item.find( '.fullname' ).attr( 'screen_name' ),
								slug: item.find( '.fullname' ).attr( 'slug' ),
								name: item.find( '.fullname' ).attr( 'name' ),
							} );

							$( this ).text( chrome.i18n.getMessage( 'i18n_0091' ) );

							UpdateToolbarUser();
						}
						// 削除
						else
						{
							var len = g_cmn.toolbar_user.length;

							for ( var i = 0 ; i < len ; i++ )
							{
								if ( g_cmn.toolbar_user[i].list_id == item.attr( 'list_id' ) && g_cmn.toolbar_user[i].type == 'list' )
								{
									g_cmn.toolbar_user.splice( i, 1 );
									break;
								}
							}

							$( this ).text( chrome.i18n.getMessage( 'i18n_0092' ) );

							UpdateToolbarUser();
						}

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// 削除ボタンクリック処理
					////////////////////////////////////////
					cont.find( '.lists_list' ).find( '.item' ).find( '.del' ).click( function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var fullname = $( this ).parent().parent().find( '.fullname' );
						var screen_name = fullname.attr( 'screen_name' );
						var mylist = fullname.attr( 'mylist' );
						var slug = fullname.attr( 'slug' );
						var listname = ( ( mylist == 1 ) ? '@' + screen_name + '/' : '' ) + slug;

						var conf = confirm( chrome.i18n.getMessage( 'i18n_0185', [listname] ) );

						if ( conf )
						{
							var param = {
								type: 'POST',
								url: ApiUrl( '1.1' ) + ( ( mylist == 0 ) ? 'lists/destroy.json' : 'lists/subscribers/destroy.json' ),
								data: {
									owner_screen_name: ( mylist == 0 ) ? account.screen_name : screen_name,
									slug: slug,
								},
							};

							Blackout( true );
							$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

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
									if ( res.status == 200 )
									{
										// 最新の状態にする
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
					ApiError( chrome.i18n.getMessage( 'i18n_0169' ), res );
					cont.activity( false );
				}

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
					scrollPos = cont.find( '.lists_list' ).scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					cont.find( '.lists_list' ).scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '.lists_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
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
		cont.addClass( 'lists' )
			.html( OutputTPL( 'lists', {} ) );

		cp.SetTitle( g_cmn.account[cp.param['account_id']].screen_name + chrome.i18n.getMessage( 'i18n_0098' ) + chrome.i18n.getMessage( 'i18n_0167' ), false );

		cont.find( '.list_create' ).hide();

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.lists_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			ListMake();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 新規作成ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.lists_add' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			cont.find( '.list_create' ).toggle()
				.css( {
					left: $( this ).position().left,
					top: $( this ).position().top + $( this ).outerHeight()
				} )
				.find( '.listname' ).focus();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 作成ボタンクリック
		////////////////////////////////////////
		cont.find( '.list_create' ).find( '.create' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var listname = cont.find( '.list_create' ).find( '.listname' );
			var desc = cont.find( '.list_create' ).find( '.description' );

			if ( listname.val().length <= 0 )
			{
				MessageBox( chrome.i18n.getMessage( 'i18n_0173' ) );
				listname.focus();
				return;
			}

			if ( listname.val().length > 25 )
			{
				MessageBox( chrome.i18n.getMessage( 'i18n_0172' ) );
				listname.focus();
				return;
			}

			if ( desc.val().length > 100 )
			{
				MessageBox( chrome.i18n.getMessage( 'i18n_0245' ) );
				desc.focus();
				return;
			}

			var mode;

			cont.find( '.list_create' ).find( '.listmode' ).each( function() {
				if ( $( this ).prop( 'checked' ) )
				{
					mode = $( this ).attr( 'value' );
				}
			} );

			var param = {
				type: 'POST',
				url: ApiUrl( '1.1' ) + 'lists/create.json',
				data: {
					name: listname.val(),
					mode: mode,
					description: desc.val()
				}
			};

			Blackout( true );
			$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

			SendRequest(
				{
					action: 'oauth_send',
					acsToken: g_cmn.account[cp.param['account_id']].accessToken,
					acsSecret: g_cmn.account[cp.param['account_id']].accessSecret,
					param: param,
					id: cp.param['account_id']
				},
				function( res )
				{
					if ( res.status == 200 )
					{
						// 最新の状態にする
						ListMake();
						cont.find( '.list_create' ).hide();
					}
					else
					{
						ApiError( chrome.i18n.getMessage( 'i18n_0170' ), res );
					}

					Blackout( false );
					$( '#blackout' ).activity( false );
				}
			);

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 公開/非公開チェック
		////////////////////////////////////////
		cont.find( '.list_create .listmode' ).click( function( e ) {
			cont.find( '.list_create .listmode' ).prop( 'checked', false );
			$( this ).prop( 'checked', true );
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
