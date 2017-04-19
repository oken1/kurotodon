"use strict";

////////////////////////////////////////////////////////////////////////////////
// GoogleMap
////////////////////////////////////////////////////////////////////////////////
Contents.googlemap = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( null );

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
				console.log( chrome.i18n.getMessage( 'i18n_0025' ) );
			}
			else if ( keys['status'] == 'latlng' )
			{
				cp.SetTitle( 'Google Map - ' + Math.round( keys['lat'] * 10000 ) / 10000 + ',' +
											   Math.round( keys['lng'] * 10000 ) / 10000, null );

				cp.param['lat'] = keys['lat'];
				cp.param['lng'] = keys['lng'];
			}
			else if ( keys['status'] == 'zoom' )
			{
				cp.param['zoom'] = keys['zoom'];
			}
		} );

		cont.addClass( 'googlemap' )
			.html( OutputTPL( 'googlemap', {} ) );

		cp.SetTitle( 'Google Map - ' );

		cont.find( 'iframe' ).attr( 'src', 'map.sandbox.html?' +
			'lat=' + cp.param['lat'] +
			'&lng=' + cp.param['lng'] +
			'&zoom=' + cp.param['zoom'] +
			'&cpid=' + cp.id );

		p.draggable( 'option', 'cancel', 'div.contents' );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
