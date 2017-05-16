////////////////////////////////////////////////////////////////////////////////
// インポート/エクスポート
////////////////////////////////////////////////////////////////////////////////
Contents.impexp = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var filesystem;
	var exportfile = 'kurotodon.data.txt';

	webkitRequestFileSystem( TEMPORARY, 1024*1024*1, function( fs ) {
		filesystem = fs;
	} );

	cp.SetIcon( 'icon-folder-open' );

	////////////////////////////////////////////////////////////
	// 一時ファイル削除
	////////////////////////////////////////////////////////////
	function DeleteTMPFile( name, callback, stopflg )
	{
		filesystem.root.getFile( name, {}, function( entry ) {
			entry.remove( callback, function( e ) {
				console.log( 'remove' );
				console.log( e );
				if ( !stopflg )
				{
					MessageBox( chrome.i18n.getMessage( 'i18n_0347' ) );
				}
			} );
		}, function( e ) {
			if ( e.name != 'NotFoundError' )
			{
				console.log( 'getFile' );
				console.log( e );

				if ( !stopflg )
				{
					MessageBox( chrome.i18n.getMessage( 'i18n_0347' ) );
				}
			}
			else
			{
				callback();
			}
		} );
	}

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.addClass( 'impexp' )
			.html( OutputTPL( 'impexp', {} ) );

		cp.SetTitle( i18nGetMessage( 'i18n_0052' ) + '/' + i18nGetMessage( 'i18n_0053' ), false );

		$( '#import .item .btn.exec' ).addClass( 'disabled' );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.bind( 'contents_resize', function() {
		} );

		cont.trigger( 'contents_resize' );

		////////////////////////////////////////
		// インポート実行ボタンクリック処理
		////////////////////////////////////////
		$( '#import .item .btn.exec' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var file = $( '#importfile_input' )[0].files[0];

			if ( file.type != 'text/plain' )
			{
				MessageBox( chrome.i18n.getMessage( 'i18n_0348' ) );
				return;
			}

			var reader = new FileReader();

			reader.onload = ( function( thefile ) {
				return function( e ) {
					try {
						var _g_cmn = JSON.parse( decodeURIComponent( e.target.result ) );
					}
					catch( e ) {
						console.log( e );
						MessageBox( chrome.i18n.getMessage( 'i18n_0348' ) );
						return;
					}

					if ( _g_cmn.current_version == undefined )
					{
						MessageBox( chrome.i18n.getMessage( 'i18n_0348' ) );
						return;
					}

					// バージョンアップと誤認しないようにバージョンを差し替え
					_g_cmn.current_version = g_cmn.current_version;

					try {
						var text = JSON.stringify( _g_cmn );
						text = encodeURIComponent( text );
					}
					catch( e ) {
						console.log( e );
						MessageBox( chrome.i18n.getMessage( 'i18n_0348' ) );
						return;
					}

					setUserInfo( 'g_cmn_V1', text );
					g_saveend = false;
					chrome.tabs.reload();
				};
			} )( file );

			reader.readAsText( file );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// エクスポート実行ボタンクリック処理
		////////////////////////////////////////
		$( '#export .item .btn.exec' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var CreateNewFile = function() {
				filesystem.root.getFile( exportfile, { 'create': true }, function( entry ) {
					entry.createWriter( function( writer ) {
						writer.onwriteend = function() {
							$( '<a download="' + exportfile + '" href="' + entry.toURL() + '" target="_blank"></a>' )[0].click();
						};

						var lines = SaveDataText();

						var blob = new Blob( [ lines ], { type: 'text.plain' } );

						writer.write( blob );
					}, function( e ) {
						console.log( 'createWriter' );
						console.log( e );
						MessageBox( chrome.i18n.getMessage( 'i18n_0347' ) );
					} );
				}, function( e ) {
					console.log( 'getFile' );
					console.log( e );
					MessageBox( chrome.i18n.getMessage( 'i18n_0347' ) );
				} );
			};

			DeleteTMPFile( exportfile, CreateNewFile );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ファイル選択ボタンクリック処理
		////////////////////////////////////////
		$( '#importselectbtn' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			$( '#importfile_input' ).click();
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ファイル選択変更時の処理
		////////////////////////////////////////
		$( '#importfile_input' ).change( function( e ) {
			if ( $( '#importfile_input' )[0].files.length == 1 )
			{
				$( '#import .item .btn.exec' ).removeClass( 'disabled' );
				$( '#importfile' ).html( $( '#importfile_input' )[0].files[0].name );
			}
			else
			{
				$( '#import .item .btn.exec' ).addClass( 'disabled' );
				$( '#importfile' ).html( chrome.i18n.getMessage( 'i18n_0119' ) );
			}

			e.stopPropagation();
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
		DeleteTMPFile( exportfile, function() {}, true );
	};
}
