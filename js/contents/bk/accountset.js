"use strict";

////////////////////////////////////////////////////////////////////////////////
// アカウント設定
////////////////////////////////////////////////////////////////////////////////
Contents.accountset = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-user' );

	////////////////////////////////////////////////////////////
	// 初期入力値設定
	////////////////////////////////////////////////////////////
	var MakeInput = function() {
		cont.html( '' )
			.addClass( 'accountset' );

		cont.activity( { color: '#ffffff' } );

		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'users/show.json',
			data: {
				user_id: g_cmn.account[cp.param['account_id']].user_id,
			},
		};

		SendRequest(
			{
				action: 'oauth_send',
				acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
				acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
				param: param,
				id:cp.param['account_id']
			},
			function( res )
			{
				if ( res.status == 200 )
				{
					cont.html( OutputTPL( 'accountset', {
						icon: res.json.profile_image_url_https,
						name: escapeHTML( res.json.name ),
						url: escapeHTML( res.json.url ),
						location: escapeHTML( res.json.location ),
						desc: escapeHTML( res.json.description ),
					} ) );

					$( '#iconselectbtn' ).removeClass( 'disabled' );
					$( '#iconuploadbtn' ).addClass( 'disabled' );
					$( '#profupdatebtn' ).removeClass( 'disabled' );
				}
				else
				{
					ApiError( chrome.i18n.getMessage( 'i18n_0160' ), res );

					cont.html( OutputTPL( 'accountset', {
						icon: '',
						name: '',
						url: '',
						location: '',
						desc: '',
					} ) );

					$( '#iconselectbtn' ).addClass( 'disabled' );
					$( '#iconuploadbtn' ).addClass( 'disabled' );
					$( '#profupdatebtn' ).addClass( 'disabled' );
				}

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );

				g_cmn.account[cp.param['account_id']].icon = res.json.profile_image_url_https;
				$( '#head' ).trigger( 'account_update' );

				$( '#profname' ).focus();

				SetFont( true );
				cont.activity( false );

				////////////////////////////////////////
				// ファイル選択ボタンクリック処理
				////////////////////////////////////////
				$( '#iconselectbtn' ).click( function( e ) {
					// disabledなら処理しない
					if ( $( this ).hasClass( 'disabled' ) )
					{
						return;
					}

					$( '#iconupload_input' ).click();
					e.stopPropagation();
				} );

				////////////////////////////////////////
				// ファイル選択変更時の処理
				////////////////////////////////////////
				$( '#iconupload_input' ).change( function( e ) {
					if ( $( '#iconupload_input' )[0].files.length == 1 )
					{
						$( '#iconuploadbtn' ).removeClass( 'disabled' );

						var f = $( '#iconupload_input' )[0].files[0];

						$( '#iconuploadbox_select > span' ).html( f.name );

						if ( f.type.match( 'image.*' ) )
						{
							var reader = new FileReader();

							reader.onload = function( e ) {
								var result = e.target.result;

								$( '#iconimg' ).attr( 'src', result );
							};

							reader.readAsDataURL( f );
						}
					}
					else
					{
						$( '#iconuploadbtn' ).addClass( 'disabled' );
						$( '#iconuploadbox_select > span' ).html( chrome.i18n.getMessage( 'i18n_0119' ) + '<br><span class="info">' + chrome.i18n.getMessage( 'i18n_0019' ) + '</span>' );
					}

					e.stopPropagation();
				} );

				////////////////////////////////////////
				// アイコン更新ボタンクリック処理
				////////////////////////////////////////
				$( '#iconuploadbtn' ).click( function( e ) {
					// disabledなら処理しない
					if ( $( this ).hasClass( 'disabled' ) )
					{
						return;
					}

					// バックグラウンドの変数にアップロードするファイルを設定
					chrome.extension.getBackgroundPage().uploadIconFile = $( '#iconupload_input' ).get( 0 ).files[0];

					$( '#iconselectbtn' ).addClass( 'disabled' );
					$( '#iconuploadbtn' ).addClass( 'disabled' );

					Blackout( true );
					$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

					SendRequest(
						{
							action: 'icon_upload',
							acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
							acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
							id: cp.param['account_id'],
						},
						function( res )
						{
							if ( res != '' )
							{
								$( '#iconimg' ).parent().activity( { color: 'ffffff' } );

								var before_url = $( '#iconimg' ).attr( 'src' );
								var chkcnt = 0;

								// アイコンの変更反映チェック
								var IconUpdateCheck = function() {
									var param = {
										type: 'GET',
										url: ApiUrl( '1.1' ) + 'users/show.json',
										data: {
											user_id: g_cmn.account[cp.param['account_id']].user_id,
										},
									};

									SendRequest(
										{
											action: 'oauth_send',
											acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
											acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
											param: param,
											id:cp.param['account_id']
										},
										function( res )
										{
											if ( res.status == 200 )
											{
												if ( res.json.profile_image_url_https != before_url )
												{
													$( '#iconimg' ).attr( 'src', res.json.profile_image_url_https )
														.parent().activity( false );

													g_cmn.account[cp.param['account_id']].icon = res.json.profile_image_url_https;
													$( '#head' ).trigger( 'account_update' );

													for ( var i = 0, _len = g_cmn.toolbar_user.length ; i < _len ; i++ )
													{
														if ( g_cmn.toolbar_user[i].user_id == g_cmn.account[cp.param['account_id']].user_id )
														{
															g_cmn.toolbar_user[i].icon = res.json.profile_image_url_https;
														}
													}

													UpdateToolbarUser();
												}
												else
												{
													chkcnt++;

													if ( chkcnt != 3 )
													{
														setTimeout( IconUpdateCheck, 3000 );
													}
													else
													{
														$( '#iconimg' ).parent().activity( false );
													}
												}
											}
											else
											{
												$( '#iconimg' ).parent().activity( false );
											}

											$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
										}
									);
								};

								setTimeout( IconUpdateCheck, 5000 );
							}
							else
							{
								MessageBox( chrome.i18n.getMessage( 'i18n_0118' ) );
							}

							Blackout( false );
							$( '#blackout' ).activity( false );

							$( '#iconselectbtn' ).removeClass( 'disabled' );
							$( '#iconuploadbtn' ).removeClass( 'disabled' );
						}
					);

					e.stopPropagation();
				} );

				////////////////////////////////////////
				// プロフィール保存ボタンクリック処理
				////////////////////////////////////////
				$( '#profupdatebtn' ).click( function( e ) {
					// disabledなら処理しない
					if ( $( this ).hasClass( 'disabled' ) )
					{
						return;
					}

					var param = {
						type: 'POST',
						url: ApiUrl( '1.1' ) + 'account/update_profile.json',
						data: {
							name: $( '#profname' ).val(),
							url: $( '#profurl' ).val(),
							location: $( '#proflocation' ).val(),
							description: $( '#profdesc' ).val()
						}
					};

					Blackout( true );
					$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

					SendRequest(
						{
							action: 'oauth_send',
							acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
							acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
							param: param,
							id: cp.param['account_id']
						},
						function( res )
						{
							if ( res.status == 200 )
							{
							}
							else
							{
								console.log( 'status[' + res.status + ']' );

								$( this ).removeClass( 'disabled' );

								ApiError( chrome.i18n.getMessage( 'i18n_0147' ), res );
							}

							Blackout( false );
							$( '#blackout' ).activity( false );
						}
					);
				} );
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
			AccountAliveCheck();
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
