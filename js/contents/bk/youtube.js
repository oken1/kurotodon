"use strict";

////////////////////////////////////////////////////////////////////////////////
// Youtube動画再生
////////////////////////////////////////////////////////////////////////////////
Contents.youtube = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( null );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.activity( { color: '#ffffff' } );

		if ( cp.param['url'].match( /https?:\/\/(?:www|m)\.youtube\.com\/watch\?.*v=([^&]+)/ ) ||
			 cp.param['url'].match( /https?:\/\/youtu.be\/([^&]+)/ ) )
		{
			var id = RegExp.$1;

			cont.addClass( 'youtube' )
				.html( OutputTPL( 'youtube', { id: id } ) );

			cp.SetTitle( 'Youtube - ' + cp.param['url'], false );
			cont.activity( false );
		}
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
