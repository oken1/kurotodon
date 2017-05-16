"use strict";

// UserStreamオブジェクト
var userstream;

// 短縮URL展開
var shorturls;

// アプリのタブID
var app_tab = null;

// アプリのmanifest.json
var app_manifest = null;

// アップロードファイルオブジェクト
var uploadFile = null;

// Ajax設定
$.ajaxSetup( {
	timeout: 30 * 1000,
} );

var tpl_c = {};

// streaming情報
// streaming[id: account_id@(user/public/federated/hashtag/notifications)]
// {
//   queue: []
// }
var streaming = {};

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
// アプリ画面との通信
////////////////////////////////////////////////////////////////////////////////
function SendMessage( data )
{
	if ( app_tab != null )
	{
		chrome.tabs.sendMessage( app_tab.id, data );
	}
}

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
						scope: 'read write follow',
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
			//       method
			//       param
			case 'api_call':
				var query = new URLSearchParams();

				if ( req.method == 'GET' && req.param )
				{
					for ( var i in req.param )
					{
						query.set( i, req.param[i] );
					}
				}

				var url = 'https://' + req.instance + '/api/v1/' + req.api;
				
				if ( query.toString().length )
				{
					url += '?' + query.toString();
				}

				console.log( url );

				$.ajax( {
					url: url,
					dataType: 'json',
					type: req.method,
					data: ( req.method == 'POST' ) ? req.param : {},
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

			// mediaアップロード
			// req : instance
			//       access_token
			//       data
			case 'media_upload':
				var url = 'https://' + req.instance + '/api/v1/media';

				console.log( url );

				var fd = new FormData();

				fd.append( 'file', uploadFile );

				$.ajax( {
					url: url,
					dataType: 'json',
					type: 'POST',
					data: fd,
					cache: false,
					contentType: false,
					processData: false,
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

				console.log( 'exit_routine' );

				// Streamingをすべて止める
				for ( var id in streaming )
				{
					streaming[id].alive = false;

					clearInterval( streaming[id].tm );
					streaming[id].queue = [];

					if ( streaming[id].reader != null )
					{
						streaming[id].reader.cancel();
					}

					console.log( 'Streaming stopped.[' + id + ']' );
				}

				sendres( '' );
				break;

			// Streaming開始
			// req: instance
			//      access_token
			//      account_id
			//      type(home/local/federated/hashtag/notifications)
			case 'streaming_start':
				var _stid = req.account_id + '@' + req.type;
				
				if ( streaming[_stid] !== undefined )
				{
					sendres( '' );
					break;
				}

				streaming[_stid] = {
					alive: true,
					instance: req.instance,
					access_token: req.access_token,
					account_id: req.account_id,
					type: req.type,
					reader: null,
					queue: [],
					tm: null,
					delete_streaming: function( _stid ) {
						streaming[_stid].reader = null;
						streaming[_stid].queue = [];
						clearInterval( streaming[_stid].tm );

						SendMessage( { action: 'stream_stopped', id: _stid, json: {} } );
						delete streaming[_stid];
					}
				}

				console.log( 'Streaming started.[' + _stid + ']' );

				var api = 'https://' + streaming[_stid].instance + '/api/v1/streaming/';
				
				switch ( req.type )
				{
					case 'home':
					case 'notifications':
						api += 'user';
						break;
					case 'local':
						api += 'public/local';
						break;
					case 'federated':
						api += 'public';
						break;
					case 'hashtag':
						api += 'hashtag';
						break;
				}

				var headers = new Headers();
				headers.set( 'Authorization', 'Bearer ' + req.access_token );

				fetch( api, {
					method: 'GET',
					mode: 'cors',
					headers: headers,
				} ).then( function( res ) {
				
					SendMessage( { action: 'stream_started', id: _stid, json: {} } );

					// キュー排出
					streaming[_stid].tm = setInterval( function() {
						if ( streaming[_stid].queue === undefined )
						{
							return;
						}

						var json = streaming[_stid].queue.shift();

						if ( json !== undefined )
						{
							SendMessage( { action: 'stream_recieved', id: _stid, json: json } );
						}
					}, 200 );

					streaming[_stid].reader = res.body.getReader();
					var decoder = new TextDecoder();
					var txt = '';
					var json = {};

					streaming[_stid].reader.read().then( function processResult( result ) {
						if ( result.done )
						{
							console.log( 'Fetch complete[' + _stid + ']' );
							streaming[_stid].alive = false;
							streaming[_stid].delete_streaming( _stid );
							return;
						}

						if ( streaming[_stid].alive == false )
						{
							streaming[_stid].reader.cancel();
						}

						// データ処理
						txt += decoder.decode( result.value || new Uint8Array, { stream: true } );
						var data = txt.split( /\n/ );
						txt = '';

						for ( var i = 0 ; i < data.length ; i++ )
						{
							if ( data[i].match( /^data: {/ ) )
							{
								try {
									Object.assign( json, JSON.parse( data[i].replace( /^data: /, '' ) ) );

									streaming[_stid].queue.push( json );
									json = {};
								}
								catch( e )
								{
									txt += data[i];
								}
							}
							else
							{
								if ( data[i].match( /^event: (.*)$/ ) )
								{
									json = { event: RegExp.$1 };
								}
							}
						}

						return streaming[_stid].reader.read().then( processResult );
					} ).catch( function( err ) {
						console.log( 'reader.read() error[' + _stid + ']' );
						console.log( err );
						streaming[_stid].alive = false;
						streaming[_stid].delete_streaming( _stid );
					} );
				} ).catch( function( err ) {
					console.log( 'Fetch error[' + _stid + ']' );
					console.log( err );
					streaming[_stid].alive = false;
					streaming[_stid].delete_streaming( _stid );
				} );

				break;

			// Streaming停止
			// req: account_id
			//      type(home/local/federated/hashtag/notifications)
			case 'streaming_pause':
				var _stid = req.account_id + '@' + req.type;

				streaming[_stid].alive = false;

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
