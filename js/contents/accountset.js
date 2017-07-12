"use strict";

////////////////////////////////////////////////////////////////////////////////
// アカウント設定
////////////////////////////////////////////////////////////////////////////////
Contents.accountset = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-cog' );

	////////////////////////////////////////////////////////////
	// タイトル設定
	////////////////////////////////////////////////////////////
	var SetTitle = function() {
		var account = g_cmn.account[cp.param.account_id];
		cp.SetTitle( i18nGetMessage( 'i18n_0047' ) + ' (' + account.display_name + '@' + account.instance + ')', false );
	};
	
	////////////////////////////////////////////////////////////
	// 初期入力値設定
	////////////////////////////////////////////////////////////
	var MakeInput = function() {
		cont.html( '' )
			.addClass( 'accountset' );

		var account = g_cmn.account[cp.param.account_id];

		SetTitle();

		cont.html( OutputTPL( 'accountset', {} ) );
		SetFont();

		$( '#avataruploadbtn' ).addClass( 'disabled' );
		$( '#headeruploadbtn' ).addClass( 'disabled' );

		Loading( true, 'accountset' );

		SendRequest(
			{
				method: 'GET',
				action: 'api_call',
				instance: account.instance,
				access_token: account.access_token,
				api: 'accounts/' + account.id,
			},
			function( res )
			{
				if ( res.status === undefined )
				{
					cont.find( '#profname' ).val( res.display_name );
					cont.find( '#profbio' ).val( $( res.note.replace( /<br \/>/g, '\n' ) ).text() );

					cont.find( '#privacy_select' ).val( account.privacy );
					
					////////////////////////////////////////
					// ファイル選択ボタンクリック処理
					////////////////////////////////////////
					$( '#avatarselectbtn,#headerselectbtn' ).click( function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var box = $( this ).parent().parent();
						
						box.find( 'input[type=file]' ).click();
						e.stopPropagation();
					} );

					////////////////////////////////////////
					// ファイル選択変更時の処理
					////////////////////////////////////////
					$( '#avatarupload_input,#headerupload_input' ).change( function( e ) {
						var upload_input = $( this );
						var box = $( this ).parent().parent();

						if ( upload_input[0].files.length == 1 )
						{
							box.find( '.uploadbtn' ).removeClass( 'disabled' );

							var f = upload_input[0].files[0];

							box.find( '.display_filename' ).html( f.name );

							if ( f.type.match( 'image.*' ) )
							{
								var reader = new FileReader();

								reader.onload = function( e ) {
									var result = e.target.result;

									box.parent().find( 'img' ).attr( 'src', result );
								};

								reader.readAsDataURL( f );
							}
						}
						else
						{
							box.find( '.uploadbtn' ).addClass( 'disabled' );
							box.find( '.display_filename' ).html( i18nGetMessage( 'i18n_0119' ) );
						}

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// アイコン・ヘッダー更新ボタンクリック処理
					////////////////////////////////////////
					$( '#avataruploadbtn,#headeruploadbtn' ).click( function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var box = $( this ).parent().parent();

						Blackout( true );
						Loading( true, 'imageupdate' );

						box.find( '.btn' ).addClass( 'disabled' );

						var param = {};
						
						if ( $( this ).attr( 'id' ) == 'avataruploadbtn' )
						{
							param.avatar = $( '#avatarimg' ).attr( 'src' )
						}
						else
						{
							param.header = $( '#headerimg' ).attr( 'src' );
						}

						SendRequest(
							{
								method: 'PATCH',
								action: 'api_call',
								instance: account.instance,
								access_token: account.access_token,
								api: 'accounts/update_credentials',
								param: param,
							},
							function( res )
							{
								if ( res.status === undefined )
								{
									account.avatar = res.avatar;
									$( '#head' ).trigger( 'account_update' );
								}
								else
								{
									ApiError( res );
								}

								Blackout( false );
								Loading( false, 'imageupdate' );
								box.find( '.btn' ).removeClass( 'disabled' );
							}
						);
						
						e.stopPropagation();
					} );
					
					////////////////////////////////////////
					// 適用ボタンクリック処理
					////////////////////////////////////////
					cont.find( '#profupdatebtn' ).click( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						Blackout( true );
						Loading( true, 'accountupdate' );
						cont.find( '#profupdatebtn' ).addClass( 'disabled' );

						SendRequest(
							{
								method: 'PATCH',
								action: 'api_call',
								instance: account.instance,
								access_token: account.access_token,
								api: 'accounts/update_credentials',
								param: {
									display_name: cont.find( '#profname' ).val(),
									note: cont.find( '#profbio' ).val()
								},
							},
							function( res )
							{
								if ( res.status === undefined )
								{
									account.display_name = res.display_name;
									$( '#head' ).trigger( 'account_update' );
								}
								else
								{
									ApiError( res );
								}

								Blackout( false );
								Loading( false, 'accountupdate' );
								cont.find( '#profupdatebtn' ).removeClass( 'disabled' );
							}
						);
					} );
					
					////////////////////////////////////////
					// 公開範囲変更処理
					////////////////////////////////////////
					$( '#privacy_select' ).change( function() {
						g_cmn.account[cp.param.account_id].privacy = $( this ).val();
					} );
				}
				else
				{
					ApiError( res );
				}

				Loading( false, 'accountset' );
			}
		);
	};

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		////////////////////////////////////////
		// このパネルを開いたアカウントが
		// 削除された場合
		////////////////////////////////////////
		var AccountAliveCheck = function() {
			if ( g_cmn.account[cp.param['account_id']] == undefined )
			{
				// パネルを閉じる
				p.find( '.close' ).trigger( 'click', [false] );
				return false;
			}

			return true;
		};

		////////////////////////////////////////
		// アカウント情報更新
		////////////////////////////////////////
		cont.on( 'account_update', function() {
			if ( AccountAliveCheck() )
			{
				SetTitle();
			}
		} );

		////////////////////////////////////////
		// アカウント変更
		////////////////////////////////////////
		cont.on( 'account_change', function() {
			MakeInput();
		} );

		// 全体を作成
		MakeInput();
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
