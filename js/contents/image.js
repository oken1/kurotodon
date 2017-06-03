"use strict";

////////////////////////////////////////////////////////////////////////////////
// イメージ表示
////////////////////////////////////////////////////////////////////////////////
Contents.image = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var scaleX = 1, scaleY = 1, rotate = 0;
	var urls = cp.param.urls.split( /\n/ );
	var types = cp.param.types.split( /\n/ );

	cp.SetIcon( 'icon-image2' );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cp.SetTitle( i18nGetMessage( 'i18n_0199' ), false );
		setTimeout( function() { Loading( true, 'image_load' ); }, 0 );

		if ( types[cp.param.index] == 'image' )
		{
			cont.addClass( 'image' )
				.html( OutputTPL( 'image', { url: urls[cp.param.index] } ) ).css( { overflow: 'auto' } );
		}
		else if ( types[cp.param.index] == 'video' || types[cp.param.index] == 'gifv' )
		{
			cont.addClass( 'image' )
				.html( OutputTPL( 'video', { url: urls[cp.param.index] } ) ).css( { overflow: 'auto' } );
		}
		else if ( types[cp.param.index] == 'youtube' )
		{
			if ( urls[cp.param.index].match( /https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([^&]+)/ ) ||
				 urls[cp.param.index].match( /https?:\/\/youtu.be\/([^&]+)/ ) )
			{
				var id = RegExp.$1;

				cont.addClass( 'image' )
					.html( OutputTPL( 'youtube', { id: id } ) ).css( { overflow: 'hidden' } );

				cp.SetTitle( 'Youtube', false );
			}
		}
		else
		{
			console.log( 'Unknown media type [' + types[cp.param['index']] + ']' );
		}

		cont.find( '.resizebtn' ).hide();

		////////////////////////////////////////
		// 画像ロード完了
		////////////////////////////////////////
		var LoadedEvent = function( e ) {
			// 実サイズ
			var nw, nh;

			if ( types[cp.param.index] == 'image' )
			{
				nw = $( e.target ).get( 0 ).naturalWidth;
				nh = $( e.target ).get( 0 ).naturalHeight;
			}
			else if ( types[cp.param.index] == 'video' || types[cp.param['index']] == 'gifv' )
			{
				nw = e.target.videoWidth;
				nh = e.target.videoHeight;
			}
			else if ( types[cp.param.index] == 'youtube' )
			{
				nw = g_defwidth * 1.5;
				nh = g_defwidth * 1.5 * 0.75;
				console.log( nw + 'x' + nh );
			}
			
			setTimeout( function() { Loading( false, 'image_load' ); }, 0 );

			// 巨大画像の表示抑止
			var mainw = $( window ).width() * 0.95;
			var mainh = ( $( window ).height() ) * 0.85;

			if ( nw > mainw )
			{
				nh = mainw * nh / nw;
				nw = mainw;
			}

			if ( nh > mainh )
			{
				nw = mainh * nw / nh;
				nh = mainh;
			}

			// タイトルバーのボタン表示分の幅を確保
			var barsize = p.find( 'div.titlebar' ).find( '.close' ).outerWidth() * 3 + 48;

			nw = ( nw < barsize ) ? barsize : nw;

			if ( nh < 200 )
			{
				nh = 200;
			}

			nh = nh + p.find( 'div.titlebar' ).outerHeight() + 24;

			p.css( {
				boxSizing: 'content-box',
				width: nw,
				height: nh,
				left: ( $( 'body' ).outerWidth() - nw ) / 2 + $( document ).scrollLeft()
			 } )
			.trigger( 'resize' );


			// 初期表示
			cont.find( '.img_panelsize' ).trigger( 'click' );
		};

		// 画像ダブルクリックで閉じる
		cont.find( 'img.image,video' ).dblclick( function( e ) {
			p.find( '.close' ).trigger( 'click', [false] );
		} );

		////////////////////////////////////////
		// パネルサイズに合わせる
		////////////////////////////////////////
		cont.find( '.img_panelsize' ).click( function( e ) {
			var pw = cont.outerWidth();
			var ph = cont.outerHeight() - p.find( 'div.titlebar' ).outerHeight()+5;

			var nw, nh;

			nw = cont.find( 'img.image' ).get( 0 ).naturalWidth;
			nh = cont.find( 'img.image' ).get( 0 ).naturalHeight;

			var pnw = pw;
			var pnh = pw / nw * nh;

			if ( pnh > ph )
			{
				pnh = ph;
				pnw = ph / nh * nw;
			}

			cont.find( 'img.image' ).css( {
				width: pnw,
				height: pnh,
			} );

			p.trigger( 'resize' );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 実サイズで表示
		////////////////////////////////////////
		cont.find( '.img_fullsize' ).click( function( e ) {
			var img = cont.find( 'img.image' );

			img.width( img.get( 0 ).naturalWidth )
				.height( img.get( 0 ).naturalHeight );

			p.trigger( 'resize' );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 上下反転
		////////////////////////////////////////
		cont.find( '.img_udreverse' ).click( function( e ) {
			scaleY = ( scaleY == 1 ) ? -1 : 1;

			cont.find( 'img.image' ).css( { '-webkit-transform': 'scale(' + scaleX + ',' + scaleY + ') rotate(' + rotate + 'deg)' } );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 左右反転
		////////////////////////////////////////
		cont.find( '.img_lrreverse' ).click( function( e ) {
			scaleX = ( scaleX == 1 ) ? -1 : 1;

			cont.find( 'img.image' ).css( { '-webkit-transform': 'scale(' + scaleX + ',' + scaleY + ') rotate(' + rotate + 'deg)' } );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 回転
		////////////////////////////////////////
		cont.find( '.img_rotate' ).click( function( e ) {
			rotate = ( rotate == 270 ) ? 0 : rotate + 90;

			cont.find( 'img.image' ).css( { '-webkit-transform': 'scale(' + scaleX + ',' + scaleY + ') rotate(' + rotate + 'deg)' } );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ページ送り→
		////////////////////////////////////////
		cont.find( '.img_pageup' ).click( function( e ) {
			if ( cp.param['index'] == urls.length - 1 )
			{
				cp.param['index'] = 0;
			}
			else
			{
				cp.param['index']++;
			}

			cont.find( '.image' ).attr( 'src', urls[cp.param['index']] );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ページ送り←
		////////////////////////////////////////
		cont.find( '.img_pagedown' ).click( function( e ) {
			if ( cp.param['index'] == 0 )
			{
				cp.param['index'] = urls.length - 1;
			}
			else
			{
				cp.param['index']--;
			}

			cont.find( '.image' ).attr( 'src', urls[cp.param['index']] );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// リサイズボタン群表示
		////////////////////////////////////////
		cont.mouseenter( function( e ) {
			cont.find( '.resizebtn' ).show();
		} );

		////////////////////////////////////////
		// リサイズボタン群非表示
		////////////////////////////////////////
		cont.mouseleave( function( e ) {
			cont.find( '.resizebtn' ).hide();
		} );

		cont.find( 'img.image' ).on( 'load', function( e ) {
			LoadedEvent( e );
		} );

		cont.find( 'video' ).on( 'loadeddata', function( e ) {
			LoadedEvent( e );
		} );

		cont.find( '.youtube-player' ).on( 'load', function( e ) {
			LoadedEvent( e );
		} );

		////////////////////////////////////////
		// キーイベント
		////////////////////////////////////////
		cont.on( 'keyevent', function( e, event ) {
			if( cont.find( '.img_pageup' ).css( 'display' ) != 'none' )
			{
				switch( event.keyCode )
				{
					case 37:
						cont.find( '.img_pagedown' ).trigger( 'click' );
						return false;
					case 39:
						cont.find( '.img_pageup' ).trigger( 'click' );
						return false;
				}
			}
		} );

		////////////////////////////////////////
		// 読み込み失敗
		////////////////////////////////////////
		var ErrorEvent = function() {
			setTimeout( function() { Loading( false, 'image_load' ); }, 0 );
		};

		cont.find( 'img.image' ).on( 'error', function() {
			ErrorEvent();
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
