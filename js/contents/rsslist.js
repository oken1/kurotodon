"use strict";

////////////////////////////////////////////////////////////////////////////////
// RSSパネル一覧
////////////////////////////////////////////////////////////////////////////////
Contents.rsslist = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var rsslist_list;
	var scrollPos = null;

	cp.SetIcon( 'icon-feed' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		cont.activity( { color: '#ffffff' } );

		rsslist_list.html( OutputTPL( 'rsslist_list', { items: g_cmn.rss_panel } ) )
			.scrollTop( 0 );

		////////////////////////////////////////
		// タイトルクリック
		////////////////////////////////////////
		rsslist_list.find( 'div.item .title span' ).click( function( e ) {
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
				var _cp = new CPanel( null, null, 320, 360, id );
				_cp.SetType( 'rss' );
				_cp.SetTitle( g_cmn.rss_panel[id].param.title, true );
				_cp.SetParam( g_cmn.rss_panel[id].param );
				_cp.Start();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 削除ボタンクリック
		////////////////////////////////////////
		rsslist_list.find( 'div.item .removebtn' ).click( function( e ) {
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

				delete g_cmn.rss_panel[id];
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
					scrollPos = rsslist_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					rsslist_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#rsslist_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 全体を作成
		cont.addClass( 'rsslist' )
			.html( OutputTPL( 'rsslist', {} ) );

		rsslist_list = $( '#rsslist_list' );

		////////////////////////////////////////
		// 新規作成ボタンクリック
		////////////////////////////////////////
		$( '#rsslist_create' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var _cp = new CPanel( null, null, 320, 360 );
			_cp.SetType( 'rss' );
			_cp.SetParam( { title: 'RSS', urls: [], reload_time: 15, count: 10 } );
			_cp.Start( function() {
				$( '#' + _cp.id ).find( 'div.titlebar' ).find( '.setting' ).trigger( 'click' );

				var _id = _cp.id.replace( /^panel_/, '' );
				g_cmn.rss_panel[_id] = {
					id: _id,
					param: _cp.param,
				};

				ListMake();
			} );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		$( '#rsslist_reload' ).click( function( e ) {
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
