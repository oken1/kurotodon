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

		cp.SetTitle( i18nGetMessage( 'i18n_0242' ), false );

		$( '#cmnsetting_apply' ).addClass( 'disabled' );

		// 言語内設定
		$( '#cset_locale' ).val( g_cmn.cmn_param['locale'] );
		
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

		$( '#cset_notify_sound_volume' ).slider( {
			min: 0.0,
			max: 1.0,
			step: 0.1,
			value: g_cmn.cmn_param['notify_sound_volume'],
			animate: 'fast',
			slide: function( e, ui ) {
				$( '#cmnsetting_apply' ).removeClass( 'disabled' );
				$( '#cset_notify_sound_volume_disp' ).html( ui.value );
			},
		} );

		////////////////////////////////////////
		// 色入力変更処理
		////////////////////////////////////////
		cont.find( '.colorcontainer' ).find( 'input[type="text"]' ).on( 'change', function() {
			var col = $( this ).val();

			$( this ).closest( '.colorcontainer' ).find( 'input[type="color"]' ).val( col );
		} );

		////////////////////////////////////////
		// 色選択変更処理
		////////////////////////////////////////
		cont.find( '.colorcontainer' ).find( 'input[type="color"]' ).on( 'change', function() {
			var col = $( this ).val();

			$( this ).closest( '.colorcontainer' ).find( 'input[type="text"]' ).val( col );
		} );

		////////////////////////////////////////
		// 色の設定をリセット
		////////////////////////////////////////
		$( '#cset_reset_color' ).on( 'click', function( e ) {
			var colors = new Array(
				$( ':root' ).css( '--default-panel-background' ),
				$( ':root' ).css( '--default-panel-text' ),
				$( ':root' ).css( '--default-tweet-background' ),
				$( ':root' ).css( '--default-tweet-text' ),
				$( ':root' ).css( '--default-tweet-link' ),
				$( ':root' ).css( '--default-titlebar-background' ),
				$( ':root' ).css( '--default-titlebar-text' ),
				$( ':root' ).css( '--default-titlebar-fixed-background' ),
				$( ':root' ).css( '--default-button-background' ),
				$( ':root' ).css( '--default-button-text' )
			);

			cont.find( '.colorcontainer' ).find( 'input[type="text"]' ).each( function( index ) {
				$( this ).val( colors[index] ).trigger( 'change' );
			} );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 色の設定をトゥート
		////////////////////////////////////////
		$( '#cset_toot_color' ).on( 'click', function( e ) {
			var text = '[Kurotodon_color_v1.0]';

			text += $( '#cset_color_panel_background' ).val() + ',' +
					$( '#cset_color_panel_text' ).val() + ',' +
					$( '#cset_color_toot_background' ).val() + ',' +
					$( '#cset_color_toot_text' ).val() + ',' +
					$( '#cset_color_toot_link' ).val() + ',' +
					$( '#cset_color_titlebar_background' ).val() + ',' +
					$( '#cset_color_titlebar_text' ).val() + ',' +
					$( '#cset_color_titlebar_fixed' ).val() + ',' +
					$( '#cset_color_button_background' ).val() + ',' +
					$( '#cset_color_button_text' ).val();

			text = text.replace( /#/g, '' );

			var pid = IsUnique( 'tootbox' );
			var left = null;
			var top = null;

			var SetText = function() {
				$( '.tootbox .text' ).each( function( e ) {
					var textbox = $( this );

					var areatext = textbox.val();
					var pos = textbox.get( 0 ).selectionStart;
					var bef = areatext.substr( 0, pos );
					var aft = areatext.substr( pos, areatext.length );

					textbox.val( bef + text + aft )
						.focus()
						.trigger( 'keyup' );

					return false;
				} );
			};

			if ( pid == null )
			{
				var _cp = new CPanel( left, top, g_defwidth, g_defheight_s );
				_cp.SetType( 'tootbox' );
				_cp.SetParam( { account_id: '' } );
				_cp.Start( function() {
					SetText();
					$( '.tootbox .text' ).SetPos( 'start' );
				} );
			}
			else
			{
				SetText();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 試聴ボタンクリック処理
		////////////////////////////////////////
		$( '#cset_audition' ).click( function( e ) {
			$( '#notify_sound' ).get( 0 ).volume = $( '#cset_notify_sound_volume' ).slider( 'value' );
			$( '#notify_sound' ).get( 0 ).play();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 設定変更時処理
		////////////////////////////////////////
		cont.find( 'input' ).change( function( e ) {
			$( '#cmnsetting_apply' ).removeClass( 'disabled' );
		} );

		$( '#cset_locale' ).change( function() {
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

			// 言語
			g_cmn.cmn_param['locale'] = $( '#cset_locale' ).val();

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

			// 色の設定
			g_cmn.cmn_param.color = {
				panel: {
					background: $( '#cset_color_panel_background' ).val(),
					text: $( '#cset_color_panel_text' ).val(),
				},
				toot: {
					background: $( '#cset_color_toot_background' ).val(),
					text: $( '#cset_color_toot_text' ).val(),
					link: $( '#cset_color_toot_link' ).val(),
				},
				titlebar: {
					background: $( '#cset_color_titlebar_background' ).val(),
					text: $( '#cset_color_titlebar_text' ).val(),
					fixed: $( '#cset_color_titlebar_fixed' ).val(),
				},
				button: {
					background: $( '#cset_color_button_background' ).val(),
					text: $( '#cset_color_button_text' ).val(),
				}
			};

			SetColorSettings();

			// 音量
			g_cmn.cmn_param['notify_sound_volume'] = $( '#cset_notify_sound_volume' ).slider( 'value' );

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
			$( '.tootbox .toot' ).attr( 'tooltip', i18nGetMessage( 'i18n_0367' ) + '(' + _tips[g_cmn.cmn_param.tootkey] + ')' );

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
