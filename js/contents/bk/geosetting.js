"use strict";

////////////////////////////////////////////////////////////////////////////////
// 位置情報設定
////////////////////////////////////////////////////////////////////////////////
Contents.geosetting = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-earth' );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		window.addEventListener( 'message', function( e ) {
			var params = e.data.split( ',' );
			var keys = {};

			for ( var i = 0, _len = params.length ; i < _len ; i++ )
			{
				var keyval = params[i].split( '=' );
				keys[keyval[0]] = keyval[1];
			}

			if ( keys['cpid'] != cp.id )
			{
				return;
			}

			if ( keys['status'] == 'error' )
			{
				$( '#geoapply' ).addClass( 'disabled' );
				$( '#curgeo' ).addClass( 'disabled' );
				console.log( chrome.i18n.getMessage( 'i18n_0025' ) );
			}
			else if ( keys['status'] == 'latlng' )
			{
				cp.param['lat'] = keys['lat'];
				cp.param['lng'] = keys['lng'];
			}
			else if ( keys['status'] == 'zoom' )
			{
				cp.param['zoom'] = keys['zoom'];
			}
		} );

		cont.addClass( 'geosetting' )
			.html( OutputTPL( 'geosetting', {} ) );

		cont.find( 'iframe' ).attr( 'src', 'map.sandbox.html?' +
			'lat=' + cp.param['lat'] +
			'&lng=' + cp.param['lng'] +
			'&zoom=' + cp.param['zoom'] +
			'&mode=setting' +
			'&cpid=' + cp.id );

		p.draggable( 'option', 'cancel', 'div.contents' );

		// 設定する
		$( '#geoapply' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var pid = IsUnique( 'tweetbox' );

			if ( pid != null )
			{
				var item = {
					lat: cp.param['lat'],
					lng: cp.param['lng'],
					zoom: cp.param['zoom'],
				};

				$( '#' + pid ).find( 'div.contents' ).trigger( 'geoapply', [item] );
			}

			p.find( '.close' ).trigger( 'click', [false] );

			e.stopPropagation();
		} );

		// 現在地取得
		$( '#curgeo' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			navigator.geolocation.getCurrentPosition( function( pos ) {
				cp.param['lat'] = pos.coords.latitude;
				cp.param['lng'] = pos.coords.longitude;

				cont.find( 'iframe' ).attr( 'src', 'map.sandbox.html?' +
					'lat=' + cp.param['lat'] +
					'&lng=' + cp.param['lng'] +
					'&zoom=' + cp.param['zoom'] +
					'&mode=setting' +
					'&cpid=' + cp.id );
			} );

			e.stopPropagation();
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
