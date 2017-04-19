"use strict";

////////////////////////////////////////////////////////////////////////////////
// 画像アップロード
////////////////////////////////////////////////////////////////////////////////
Contents.imageupload = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-image' );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		// Twitpic削除
		if ( g_cmn.cmn_param.image_service == 0 )
		{
			g_cmn.cmn_param.image_service = 1;
		}

		// 全体を作成
		cont.addClass( 'imageupload' )
			.html( OutputTPL( 'imageupload', { service: g_cmn.cmn_param.image_service } ) );

		$( '#imageuploadbtn' ).addClass( 'disabled' );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#imageuploadbox_btn' ).width( p.width() - 12 );
		} );

		cont.trigger( 'contents_resize' );

		////////////////////////////////////////
		// アカウント情報更新
		////////////////////////////////////////
		cont.on( 'account_update', function() {
			// アカウントが0件の場合はパネルを閉じる
			if ( AccountCount() == 0 )
			{
				// 検索パネルを閉じる
				p.find( '.close' ).trigger( 'click', [false] );
				return;
			}
			else
			{
				AccountSelectMake( cp );
				cont.trigger( 'account_changed' );
			}
		} );

		cont.trigger( 'account_update' );

		////////////////////////////////////////
		// アップロード先変更処理
		////////////////////////////////////////
		$( 'input[name=imageupload_service]' ).change( function( e ) {
			g_cmn.cmn_param.image_service = $( 'input[name=imageupload_service]:checked' ).val();
		} );

		////////////////////////////////////////
		// ファイル選択ボタンクリック処理
		////////////////////////////////////////
		$( '#imageselectbtn' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			$( '#imageupload_input' ).click();
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ファイル選択変更時の処理
		////////////////////////////////////////
		$( '#imageupload_input' ).change( function( e ) {
			if ( $( '#imageupload_input' )[0].files.length == 1 )
			{
				$( '#imageuploadbtn' ).removeClass( 'disabled' );
// 2012/06/26 変数名変更？対応
//				$( '#selectfile' ).html( $( '#imageupload_input' )[0].files[0].fileName );
				$( '#selectfile' ).html( $( '#imageupload_input' )[0].files[0].name );
			}
			else
			{
				$( '#imageuploadbtn' ).addClass( 'disabled' );
				$( '#selectfile' ).html( chrome.i18n.getMessage( 'i18n_0119' ) );
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アップロードボタンクリック処理
		////////////////////////////////////////
		$( '#imageuploadbtn' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// バックグラウンドの変数にアップロードするファイルを設定
			chrome.extension.getBackgroundPage().uploadFile = $( '#imageupload_input' ).get( 0 ).files[0];

			$( '#imageselectbtn' ).addClass( 'disabled' );
			$( '#imageuploadbtn' ).addClass( 'disabled' );

			Blackout( true );
			$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

			SendRequest(
				{
					action: 'image_upload',
					acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
					acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
					id: cp.param['account_id'],
					service_id: $( 'input[name=imageupload_service]:checked' ).val(),
				},
				function( res )
				{
					if ( res != '' )
					{
						$( '#head_tweet' ).trigger( 'click' );
						$( '#tweetbox_text' ).val( $( '#tweetbox_text' ).val() + res )
							.trigger( 'keyup' );
					}
					else
					{
						MessageBox( chrome.i18n.getMessage( 'i18n_0118' ) );
					}

					$( '#imageselectbtn' ).removeClass( 'disabled' );
					$( '#imageuploadbtn' ).removeClass( 'disabled' );

					Blackout( false );
					$( '#blackout' ).activity( false );
				}
			);

			e.stopPropagation();
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
