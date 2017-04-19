"use strict";

////////////////////////////////////////////////////////////////////////////////
// グループストリーム一覧
////////////////////////////////////////////////////////////////////////////////
Contents.grouplist = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var grouplist_list;
	var scrollPos = null;

	cp.SetIcon( 'icon-users' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		cont.activity( { color: '#ffffff' } );

		grouplist_list.html( OutputTPL( 'grouplist_list', { items: g_cmn.group_panel } ) )
			.scrollTop( 0 );

		////////////////////////////////////////
		// タイトルクリック
		////////////////////////////////////////
		grouplist_list.find( 'div.item .title span' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var item = $( this ).parent().parent();
			var id = item.attr( 'id' );

			// 既に開かれている
			if ( GetPanel( 'panel_' + id ) != null )
			{
				SetFront( $( '#panel_' + id ) );
			}
			else
			{
				var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75, id );
				_cp.SetType( 'timeline' );
				_cp.SetTitle( g_cmn.group_panel[id].param.title, true );
				_cp.SetParam( g_cmn.group_panel[id].param );
				_cp.Start();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 削除ボタンクリック
		////////////////////////////////////////
		grouplist_list.find( 'div.item .removebtn' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			if ( confirm( chrome.i18n.getMessage( 'i18n_0224' ) ) )
			{
				var item = $( this ).parent().parent();
				var id = item.attr( 'id' );

				// 開いている場合は閉じる
				if ( GetPanel( 'panel_' + id ) != null )
				{
					$( '#panel_' + id ).find( '.close' ).trigger( 'click', [false] );
				}

				delete g_cmn.group_panel[id];
				ListMake();
			}

			e.stopPropagation();
		} );

		cont.trigger( 'contents_resize' );

		cont.activity( false );
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
					scrollPos = grouplist_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					grouplist_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#grouplist_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 全体を作成
		cont.addClass( 'grouplist' )
			.html( OutputTPL( 'grouplist', {} ) );

		grouplist_list = $( '#grouplist_list' );

		////////////////////////////////////////
		// 新規作成ボタンクリック
		////////////////////////////////////////
		$( '#grouplist_create' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var cnt = 0;

			for ( var n in g_cmn.group_panel ) cnt++;

			if ( cnt >= 20 )
			{
				MessageBox( chrome.i18n.getMessage( 'i18n_0069' ) );
			}
			else
			{
				var account_id = null;

				// 先頭のアカウントをデフォルト選択
				if ( g_cmn.account_order.length > 0 )
				{
					account_id = g_cmn.account_order[0];
				}

				var MakeUniqueName = function() {
					var cnt = 1;

					for ( ; ; cnt++ )
					{
						var chk = false;
						var _name = chrome.i18n.getMessage( 'i18n_0061' ) + cnt;

						for ( var id in g_cmn.group_panel )
						{
							if ( g_cmn.group_panel[id].param.title == _name )
							{
								chk = true;
								break;
							}
						}

						if ( chk == false )
						{
							return _name;
						}
					}
				};

				var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75 );
				_cp.SetType( 'timeline' );
				_cp.SetParam( { timeline_type: 'group', title: MakeUniqueName(), users: {}, count: 0, account_id: account_id } );
				_cp.Start( function() {
					$( '#' + _cp.id ).find( 'div.titlebar' ).find( '.setting' ).trigger( 'click' );

					var _id = _cp.id.replace( /^panel_/, '' );
					g_cmn.group_panel[_id] = {
						id: _id,
						param: _cp.param,
					};

					ListMake();
				} );
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		$( '#grouplist_reload' ).click( function( e ) {
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
