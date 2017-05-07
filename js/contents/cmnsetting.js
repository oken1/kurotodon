"use strict";

////////////////////////////////////////////////////////////////////////////////
// 設定
////////////////////////////////////////////////////////////////////////////////
Contents.cmnsetting = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var scrollPos = null;

	cp.SetIcon( 'icon-cog' );

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
					scrollPos = $( '#cmnsetting_items' ).scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					$( '#cmnsetting_items' ).scrollTop( scrollPos );
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#cmnsetting_items' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 全体を作成
		cont.addClass( 'cmnsetting' )
			.html( OutputTPL( 'cmnsetting', {
				param: g_cmn.cmn_param,
			} ) );

		$( '#cmnsetting_apply' ).addClass( 'disabled' );

		// 現行値設定(スライダー)
		$( '#cset_font_size' ).slider( {
			min: 10,
			max: 24,
			value: g_cmn.cmn_param['font_size'],
			animate: 'fast',
			slide: function( e, ui ) {
				$( '#cmnsetting_apply' ).removeClass( 'disabled' );
				$( '#cset_font_size_disp' ).html( ui.value + 'px' );
			},
		} );

		////////////////////////////////////////
		// 設定変更時処理
		////////////////////////////////////////
		cont.find( 'input' ).change( function( e ) {
			$( '#cmnsetting_apply' ).removeClass( 'disabled' );
		} );

		$( '#cset_font_family' ).keyup( function() {
			if ( $( this ).val() != g_cmn.cmn_param['font_family'] )
			{
				$( '#cmnsetting_apply' ).removeClass( 'disabled' );
			}
		} );

		$( '#cset_nowbrowsing_text' ).keyup( function() {
			if ( $( this ).val() != g_cmn.cmn_param['nowbrowsing_text'] )
			{
				$( '#cmnsetting_apply' ).removeClass( 'disabled' );
			}
		} );

		////////////////////////////////////////
		// 適用ボタンクリック処理
		////////////////////////////////////////
		$( '#cmnsetting_apply' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// フォントサイズ
			g_cmn.cmn_param['font_size'] = $( '#cset_font_size' ).slider( 'value' );

			// フォント名
			if ( $( '#cset_font_family' ).val().length <= 64 )
			{
				g_cmn.cmn_param['font_family'] = escapeHTML( $( '#cset_font_family' ).val() );
			}

			SetFont();

			// ページ全体のスクロールバー
			var old_v = g_cmn.cmn_param['scroll_vertical'];
			var old_h = g_cmn.cmn_param['scroll_horizontal'];

			g_cmn.cmn_param['scroll_vertical'] = ( $( '#cset_scroll_vertical' ).prop( 'checked' ) ) ? 1 : 0;
			g_cmn.cmn_param['scroll_horizontal'] = ( $( '#cset_scroll_horizontal' ).prop( 'checked' ) ) ? 1 : 0;

			$( 'body' ).css( {
				'overflow-y': ( g_cmn.cmn_param['scroll_vertical'] == 1 ) ? 'auto' : 'hidden',
				'overflow-x': ( g_cmn.cmn_param['scroll_horizontal'] == 1 ) ? 'auto' : 'hidden'
			} );

			// スクロールバーが消えない問題対策(変更があったときのみ)
			if ( ( old_v != g_cmn.cmn_param['scroll_vertical'] || old_h != g_cmn.cmn_param['scroll_horizontal'] ) &&
				 ( g_cmn.cmn_param['scroll_vertical'] == 0 || g_cmn.cmn_param['scroll_horizontal'] == 0 ) )
			{
				setTimeout( function() { $( 'body' ).hide(); setTimeout( function() { $( 'body' ).show(); }, 0 ) }, 0 );
			}

			// トゥートショートカットキー
			g_cmn.cmn_param['tootkey'] = $( 'input[name=cset_tootkey]:checked' ).val();

			// Now Browsingテキスト
			if ( $( '#cset_nowbrowsing_text' ).val().length <= 140 )
			{
				g_cmn.cmn_param['nowbrowsing_text'] = escapeHTML( $( '#cset_nowbrowsing_text' ).val() );
			}

			$( 'panel' ).trigger( 'resize' );

			$( '#cmnsetting_apply' ).addClass( 'disabled' );

			SaveData();

			// トゥートボタンのツールチップを設定に合わせる
			var _tips = new Array( 'Ctrl+Enter', 'Shift+Enter', 'Enter' );
			$( '.tootbox .toot' ).attr( 'tooltip', chrome.i18n.getMessage( 'i18n_0367' ) + '(' + _tips[g_cmn.cmn_param.tootkey] + ')' );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 分類部クリック処理
		////////////////////////////////////////
		cont.find( '.kind' ).click( function( e ) {
			var img_off = 'icon-play';
			var img_on = 'icon-arrow_down';

			if ( $( this ).find( '> span' ).hasClass( img_on ) )
			{
				$( this ).find( '> span' ).removeClass( img_on ).addClass( img_off )
					.end()
					.next().slideUp( 0 );
			}
			else
			{
				$( this ).find( '> span' ).removeClass( img_off ).addClass( img_on )
					.end()
					.next().slideDown( 200 );
			}

			e.stopPropagation();
		} );

		cont.find( '.kind' ).trigger( 'click' );

		cont.trigger( 'contents_resize' );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
