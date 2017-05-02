"use strict";

// UserStreamオブジェクト
var userstream;

// 短縮URL展開
var shorturls;

// アプリのタブID
var app_tab = null;

// アプリのmanifest.json
var app_manifest = null;

// Ajax設定
$.ajaxSetup( {
	timeout: 30 * 1000,
} );

var tpl_c = {};

chrome.browserAction.onClicked.addListener( function( tab ) {
	chrome.windows.getAll( { populate: true }, function( wins ) {
		var multi = false;
		var focuswin = null;

		for ( var i = 0, _len = wins.length ; i < _len ; i++ )
		{
			if ( wins[i].focused )
			{
				focuswin = wins[i];
			}

			for ( var j = 0, __len = wins[i].tabs.length ; j < __len ; j++ )
			{
				if ( wins[i].tabs[j].url.match( /^chrome-extension:\/\// ) &&
					 wins[i].tabs[j].title == 'Kurotodon' )
				{
					// 多重起動
					multi = true;

					// 既に開いているウィンドウ＆タブにフォーカス
					chrome.windows.update( wins[i].id, { focused: true } );
					chrome.tabs.update( wins[i].tabs[j].id, { selected: true } );

					break;
				}
			}
		}

		if ( multi == false )
		{
			var param = { url: chrome.extension.getURL( 'index.html' ) };

			if ( focuswin != null )
			{
				param.windowId = focuswin.id;
			}

			chrome.tabs.create( param );
		}
	} );
} );

////////////////////////////////////////////////////////////////////////////////
// コンテントスクリプトからの要求を受け付ける
////////////////////////////////////////////////////////////////////////////////
chrome.extension.onMessage.addListener(
	function( req, sender, sendres )
	{
		switch( req.action )
		{
			// アプリ登録
			// req : instance
			case 'register_app':
				$.ajax( {
					url: 'https://' + req.instance + '/api/v1/apps',
					dataType: 'json',
					type: 'POST',
					data: {
						client_name: app_manifest.name,
						redirect_uris: 'urn:ietf:wg:oauth:2.0:oob',
						scopes: 'read write follow'
					}
				} ).done( function( data ) {
					sendres( data );
				} ).fail( function( data ) {
					sendres( data );
				} );

				break;

			// アクセストークン取得
			// req : instance
			//       client_id
			//       client_secret
			//       username
			//       password
			case 'get_access_token':
				$.ajax( {
					url: 'https://' + req.instance + '/oauth/token',
					dataType: 'json',
					type: 'POST',
					data: {
						client_id: req.client_id,
						client_secret: req.client_secret,
						grant_type: 'password',
						username: req.username,
						password: req.password,
					}
				} ).done( function( data ) {
					sendres( data );
				} ).fail( function( data ) {
					sendres( data );
				} );

				break;

			// API呼び出し
			// req : instance
			//       api
			//       access_token
			//       param/post (GET/POST)
			case 'api_call':
				var query = new URLSearchParams();

				for ( var i in req.param )
				{
					query.set( i, req.param[i] );
				}

				var url = 'https://' + req.instance + '/api/v1/' + req.api + ( req.param ? '?' : '' ) + query.toString();

				console.log( url );

				$.ajax( {
					url: url,
					dataType: 'json',
					type: ( req.post ) ? 'POST' : 'GET',
					data: req.post,
					headers: {
						'Authorization': 'Bearer ' + req.access_token
					}
				} ).done( function( data ) {
					sendres( data );
				} ).fail( function( data ) {
					data.url = url;
					sendres( data );
				} );

				break;

			// 開始
			case 'start_routine':
				// 初期化

				sendres( '' );
				break;

			// 終了
			case 'exit_routine':
				// 変数をクリア
				app_tab = null;
				app_manifest = null;

				sendres( '' );
				break;

			// RSS取得
			// req : url
			//       count
			//       index
			case 'feed':
				var res = {
					items: [],
					url: req.url,
					index: req.index,
				};

				res.items.push( { feedtitle: '', feedlink: '' } );

				$.ajax( {
					url: req.url,
					dataType: 'xml',
					type: 'GET',
				} ).done( function( data ) {
					res.items[0].feedtitle = $( 'channel', data ).find( '> title' ).text();
					res.items[0].feedlink = $( 'channel', data ).find( '> link' ).text();

					var item = $( 'item', data );

					for ( var i = 0, _len = req.count ; i < _len ; i++ )
					{
						if ( i < item.length )
						{
							res.items.push( {
								title: $( item[i] ).find ( '> title' ).text(),
								link: $( item[i] ).find ( '> link' ).text(),
								description: $( item[i] ).find( '> description' ).text().replace( /(<([^>]+)>)/ig, '' ),
							} );
						}
					}

					sendres( res );
				} ).fail( function( data ) {
					sendres( res );
				} );

				break;

			default:
				break;
		}

		return true;
	}
);
