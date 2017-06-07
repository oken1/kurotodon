"use strict";

////////////////////////////////////////////////////////////////////////////////
// インスタンスを覗く
////////////////////////////////////////////////////////////////////////////////
Contents.peep = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-eye' );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.addClass( 'peep' )
			.html( OutputTPL( 'peep', {} ) );

		cp.SetTitle( i18nGetMessage( 'i18n_0008' ), false );

		$( '#peep_box' ).find( '.btn' ).addClass( 'disabled' );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			p.css( 'height', p.find( '.titlebar' ).outerHeight() + cont.find( '#peep_box' ).outerHeight() + parseInt( p.css( 'border-top-width' ) ) * 2 );
		} );

		cont.trigger( 'contents_resize' );

		////////////////////////////////////////
		// 開くボタンクリック処理
		////////////////////////////////////////
		$( '#peep_open' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var _cp = new CPanel( null, null, g_defwidth, g_defheight_l );
			_cp.SetType( 'peeptimeline' );

			_cp.SetParam( {
				timeline_type: 'peep',
				instance: $( '#peep_text' ).val(),
				reload_time: g_cmn.cmn_param['reload_time'],
				streaming: false,
			} );
			_cp.Start();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 入力文字数によるボタン制御
		////////////////////////////////////////
		$( '#peep_text' ).on( 'keyup change', function() {
			var slen = $( this ).val().length;

			if ( slen > 0 )
			{
				$( '#peep_box' ).find( '.btn' ).removeClass( 'disabled' );
			}
			else
			{
				$( '#peep_box' ).find( '.btn' ).addClass( 'disabled' );
			}
		} );

		$( '#peep_text' ).focus();

		////////////////////////////////////////
		// Enterで検索実行
		////////////////////////////////////////
		$( '#peep_text' ).keypress( function( e ) {
			if ( e.keyCode == 13 )
			{
				$( '#peep_open' ).trigger( 'click' );
			}
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
