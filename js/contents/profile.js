"use strict";

////////////////////////////////////////////////////////////////////////////////
// ユーザ情報表示
////////////////////////////////////////////////////////////////////////////////
Contents.profile = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-user' );

	////////////////////////////////////////////////////////////
	// ユーザ情報作成
	////////////////////////////////////////////////////////////
	var ProfileMake = function() {
		cont.html( '' )
			.addClass( 'profile' );

		cont.activity( { color: '#ffffff' } );
		cp.SetTitle( i18nGetMessage( 'i18n_0107' ) + 
			'(' + g_cmn.account[cp.param['account_id']].display_name + '@' + g_cmn.account[cp.param['account_id']].instance + ')', false );

		SendRequest(
			{
				method: 'GET',
				action: 'api_call',
				instance: g_cmn.account[cp.param['account_id']].instance,
				api: 'accounts/' + cp.param['id'],
				access_token: g_cmn.account[cp.param['account_id']].access_token
			},
			function( res )
			{
				if ( res.status === undefined )
				{
					cp.SetTitle( res.display_name + ' ' + i18nGetMessage( 'i18n_0107' ) + 
						'(' + g_cmn.account[cp.param['account_id']].display_name + '@' + g_cmn.account[cp.param['account_id']].instance + ')', false );

					cont.html( OutputTPL( 'profile',
						{
							avatar: res.avatar,
							display_name: res.display_name,
							acct: res.acct,
							note: res.note,
							statuses_count: NumFormat( res.statuses_count ),
							following_count: NumFormat( res.following_count ),
							followers_count: NumFormat( res.followers_count ),
						}
					) );
					
					if ( res.header )
					{
						cont.find( '.profilebase' ).css( {
							backgroundImage: 'url("' + res.header + '")',
							backgroundSize: 'cover'
						} );
					}

					cont.activity( { color: '#ffffff' } );

					SendRequest(
						{
							method: 'GET',
							action: 'api_call',
							instance: g_cmn.account[cp.param['account_id']].instance,
							api: 'accounts/relationships',
							access_token: g_cmn.account[cp.param['account_id']].access_token,
							param: {
								id: cp.param['id']
							},
						},
						function( res )
						{
							if ( res.status === undefined )
							{
								cont.find( '.profilebase' ).append( OutputTPL( 'profile_relationships',
									{
										following: res[0].following,
										muting: res[0].muting,
										blocking: res[0].blockinbg,
									}
								) );
							}
							else
							{
								ApiError( res );
							}

							cont.activity( false );
							cont.css( {
								height: cont.find( '.profilebase' ).outerHeight(),
							} );
							
							p.css( {
								height: cont.outerHeight() + p.find( '.titlebar' ).outerHeight() +
										parseInt( p.css( 'border-top-width' ) ) * 2
							} );
							
							// フォロー/解除
							cont.find( '.relationships .follow' ).on( 'click', function( e ) {
								var api = 'accounts/' + cp.param.id + '/';

								if ( $( this ).hasClass( 'on' ) )
								{
									api += 'unfollow';
								}
								else
								{
									api += 'follow';
								}
								
								cont.activity( { color: '#ffffff' } );

								SendRequest(
									{
										method: 'POST',
										action: 'api_call',
										instance: g_cmn.account[cp.param['account_id']].instance,
										api: api,
										access_token: g_cmn.account[cp.param['account_id']].access_token,
									},
									function( res )
									{
										if ( res.status === undefined )
										{
											if ( res.following )
											{
												cont.find( '.relationships .follow' ).addClass( 'on' );
											}
											else
											{
												cont.find( '.relationships .follow' ).removeClass( 'on' );
											}
										}
										else
										{
											ApiError( res );
										}

										cont.activity( false );
									}
								);
							} );

							// ミュート/解除
							cont.find( '.relationships .mute' ).on( 'click', function( e ) {
								var api = 'accounts/' + cp.param.id + '/';

								if ( $( this ).hasClass( 'on' ) )
								{
									api += 'unmute';
								}
								else
								{
									api += 'mute';
								}
								
								cont.activity( { color: '#ffffff' } );

								SendRequest(
									{
										method: 'POST',
										action: 'api_call',
										instance: g_cmn.account[cp.param['account_id']].instance,
										api: api,
										access_token: g_cmn.account[cp.param['account_id']].access_token,
									},
									function( res )
									{
										if ( res.status === undefined )
										{
											if ( res.muting )
											{
												cont.find( '.relationships .mute' ).addClass( 'on' );
											}
											else
											{
												cont.find( '.relationships .mute' ).removeClass( 'on' );
											}
										}
										else
										{
											ApiError( res );
										}

										cont.activity( false );
									}
								);
							} );

							// ブロック/解除
							cont.find( '.relationships .block' ).on( 'click', function( e ) {
								var api = 'accounts/' + cp.param.id + '/';

								cont.activity( { color: '#ffffff' } );

								var _api_call = function() {
									SendRequest(
										{
											method: 'POST',
											action: 'api_call',
											instance: g_cmn.account[cp.param['account_id']].instance,
											api: api,
											access_token: g_cmn.account[cp.param['account_id']].access_token,
										},
										function( res )
										{
											if ( res.status === undefined )
											{
												if ( res.blocking )
												{
													cont.find( '.relationships .block' ).addClass( 'on' );
												}
												else
												{
													cont.find( '.relationships .block' ).removeClass( 'on' );
												}
											}
											else
											{
												ApiError( res );
											}

											cont.activity( false );
										}
									);
								}

								if ( $( this ).hasClass( 'on' ) )
								{
									api += 'unblock';
									_api_call();
								}
								else
								{
									api += 'block';
									
									if ( confirm( i18nGetMessage( 'i18n_0398' ) ) )
									{
										_api_call();
									}
								}
							} );
						}
					);
				}
				else
				{
					ApiError( res );
				}

				cont.activity( false );
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

		if ( !AccountAliveCheck() )
		{
			return;
		}

		ProfileMake();
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
