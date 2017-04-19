"use strict";

////////////////////////////////////////////////////////////////////////////////
// ユーザ情報表示
////////////////////////////////////////////////////////////////////////////////
Contents.show = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-user' );

	////////////////////////////////////////////////////////////
	// ユーザ情報作成
	////////////////////////////////////////////////////////////
	var ShowMake = function() {
		cont.html( '' )
			.addClass( 'show' );

		cont.activity( { color: '#ffffff' } );

		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'users/show.json',
			data: ( cp.param['user_id'] ) ? { user_id: cp.param['user_id'] } : { screen_name: cp.param['screen_name'] },
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
					var json = res.json;

					// 原寸サイズアイコンのURL
					var orgurl;

					if ( json.profile_image_url_https.match( /default_profile_.+?_normal.png$/ ) )
					{
						orgurl = json.profile_image_url_https.replace( /_normal\./, '_bigger.' );
					}
					else
					{
						orgurl = json.profile_image_url_https.replace( /_normal\./, '.' );
					}

					// Twitter歴
					var dt = new Date();
					var cr = DateConv( json.created_at, 0 );
					var compdate = CompareDate( dt.getFullYear(), dt.getMonth() + 1, dt.getDate(),
						cr.substring( 0, 4 ), cr.substring( 5, 7 ), cr.substring( 8, 10 ) );

					var hist = NumFormat( compdate ) + chrome.i18n.getMessage( 'i18n_0259' ) + '(' + 
						cr.substring( 0, 4 ) + '/' + cr.substring( 5, 7 ) + '/' + cr.substring( 8, 10 ) + '-' + ')';

					// 自己紹介
					var desc = json.description;

					if ( json.entities.description )
					{
						desc = Txt2Link( desc, json.entities.description );
					}

					// url
					var url = json.url;

					if ( json.entities.url )
					{
						url = Txt2Link( url, json.entities.url );
					}

					var assign = {
						icon: orgurl,
						protected: json.protected,
						verified: json.verified,
						name: json.name,
						location: json.location,
						url: url,
						description: desc,
						hist: hist,
						latest_date: ( json.status && json.status.created_at ) ? DateConv( json.status.created_at, 0 ) : null,
						latest: ( json.status && json.status.text ) ? json.status.text : null,
						statuses_count: NumFormat( json.statuses_count ),
						friends_count: NumFormat( json.friends_count ),
						followers_count: NumFormat( json.followers_count ),
						favourites_count: NumFormat( json.favourites_count ),
						id: json.id_str,
						following: ( json.following ) ? 1 : 0,
						blocking: IsBlockUser( cp.param['account_id'], json.id_str ) ? 1 : 0,
						screen_name: cp.param['screen_name'],
						header: json.profile_banner_url,
					};

					cont.html( OutputTPL( 'show', assign ) );

					var iconsize;

					// スタイルを公式の設定に合わせる
					cont.css( {
						backgroundColor: '#' + json.profile_background_color,
						backgroundImage: 'url( "' + json.profile_background_image_url_https + '" )',
						backgroundRepeat: ( json.profile_background_tile ) ? 'repeat' : 'no-repeat',
					} );

					cont.find( '.showcontainer' ).css( {
						backgroundColor: '#ffffff',
						color: '#' + json.profile_text_color,
					} );

					cont.find( '.showcontainer' ).find( 'a' ).css( {
						color: '#' + json.profile_link_color,
					} );

					if ( json.profile_banner_url == undefined )
					{
						iconsize = 48;
					}
					else
					{
						p.css( { width: '528px', height: '450px' } ).trigger( 'resize' );

						cont.find( '.header' ).css( {
							backgroundImage: 'url( ' + json.profile_banner_url + '/web )',
							backgroundRepeat: 'no-repeat',
							color: 'white',
							textShadow: '0 1px 1px rgba( 0, 0, 0, 0.5 )',
						} )
						.find( 'a' ).css( {
							color: 'white'
						} );

						if ( !orgurl.match( /_bigger\./ ) )
						{
							cont.find( '.icon' ).find( 'img' ).attr( 'src', json.profile_image_url_https.replace( /_normal\./, '_bigger.' ) );
						}

						iconsize = 73;
					}

					cont.find( '.followcontainer' ).css( {
						backgroundColor: '#ffffff',
						color: '#' + json.profile_text_color,
					} );

					cont.find( '.followcontainer' ).find( 'a' ).css( {
						color: '#' + json.profile_link_color,
					} );

					// 原寸表示出来ない場合、画像クリックで原寸表示
					var img = cont.find( '.icon' ).find( 'img' );

					img.load( function() {
						img.addClass( 'exp' );

						img.click( function( e ) {
							var _cp = new CPanel( null, null, 320, 360 );
							_cp.SetType( 'image' );
							_cp.SetParam( {
								url: orgurl,
							} );
							_cp.Start();

							e.stopPropagation();
						} );
					} );

					// 自分の情報の場合、ボタンを隠す
					if ( cp.param['screen_name'] == g_cmn.account[cp.param['account_id']]['screen_name'] )
					{
						cont.find( '.buttons.others' ).hide();
						cont.find( '.buttons.me' ).show();
					}
					else
					{
						cont.find( '.buttons.others' ).show();
						cont.find( '.buttons.me' ).hide();
					}

					// KuroTwiに登録しているアカウントの場合、アカウント情報のフォロー数を更新
					var id = IsMyAccount( json.id );

					if ( id )
					{
						g_cmn.account[id]['follow'] = json.friends_count;
						g_cmn.account[id]['follower'] = json.followers_count;
						g_cmn.account[id]['statuses_count'] = json.statuses_count;
						g_cmn.account[id]['icon'] = json.profile_image_url_https;

						var pid = IsUnique( 'account' );

						// アカウントパネルを開いている場合のみ
						if ( pid != null )
						{
							$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );
						}
					}

					////////////////////////////////////////
					// @ユーザー名、ツイート数クリック処理
					////////////////////////////////////////
					cont.find( '.screen_name a, .anchor.tweets' ).click( function( e ) {
						OpenUserTimeline( cp.param['screen_name'], cp.param['account_id'] );

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// フォロークリック処理
					////////////////////////////////////////
					cont.find( '.anchor.friends' ).click( function( e ) {
						var _cp = new CPanel( null, null, 320, 360 );
						var num = $( this ).attr( 'number' );

						_cp.SetType( 'follow' );
						_cp.SetParam( {
							type: 'friends',
							account_id: cp.param['account_id'],
							screen_name: cp.param['screen_name'],
							number: num,
						} );
						_cp.Start();

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// フォロワークリック処理
					////////////////////////////////////////
					cont.find( '.anchor.followers' ).click( function( e ) {
						var _cp = new CPanel( null, null, 320, 360 );
						var num = $( this ).attr( 'number' );

						_cp.SetType( 'follow' );
						_cp.SetParam( {
							type: 'followers',
							account_id: cp.param['account_id'],
							screen_name: cp.param['screen_name'],
							number: num,
						} );
						_cp.Start();

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// お気に入りクリック処理
					////////////////////////////////////////
					cont.find( '.anchor.favourites' ).click( function( e ) {
						var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75 );
						_cp.SetType( 'timeline' );
						_cp.SetParam( {
							account_id: cp.param['account_id'],
							timeline_type: 'favorites',
							screen_name: cp.param['screen_name'],
							reload_time: g_cmn.cmn_param['reload_time'],
						} );
						_cp.Start();

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// フォローする/解除クリック処理
					////////////////////////////////////////
					cont.find( '.buttons' ).find( '.follow' ).click( function( e ) {
						var following = $( this ).attr( 'following' );

						var conf = confirm( ( following == 1 ) ? chrome.i18n.getMessage( 'i18n_0133' ) : chrome.i18n.getMessage( 'i18n_0127' ) );

						if ( conf )
						{
							var param = {
								type: 'POST',
								url: ApiUrl( '1.1' ) + 'friendships/' + ( ( following == 1 ) ? 'destroy' : 'create' ) + '.json',
								data: {
									screen_name: cp.param['screen_name'],
								},
							};

							Blackout( true );
							$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

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
										if ( following == 1 )
										{
											cont.find( '.buttons' ).find( '.follow' ).attr( 'following', 0 ).html( chrome.i18n.getMessage( 'i18n_0128' ) );

											// フォローリストから削除
											if ( g_cmn.account[cp.param['account_id']].notsave.friends != undefined )
											{
												for ( var i = 0, _len = g_cmn.account[cp.param['account_id']].notsave.friends.length ; i < _len ; i++ )
												{
													if ( g_cmn.account[cp.param['account_id']].notsave.friends[i] == res.json.id )
													{
														g_cmn.account[cp.param['account_id']].notsave.friends.splice( i, 1 );
														break;
													}
												}
											}
										}
										else
										{
											cont.find( '.buttons' ).find( '.follow' ).attr( 'following', 1 ).html( chrome.i18n.getMessage( 'i18n_0135' ) );

											// フォローリストに追加
											if ( g_cmn.account[cp.param['account_id']].notsave.friends != undefined )
											{
												g_cmn.account[cp.param['account_id']].notsave.friends.push( res.json.id );
											}
										}
									}
									else
									{
										ApiError( ( following == 1 ) ? chrome.i18n.getMessage( 'i18n_0134' ) : chrome.i18n.getMessage( 'i18n_0129' ), res );
									}

									Blackout( false );
									$( '#blackout' ).activity( false );
								}
							);
						}

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// ブロックする/解除クリック処理
					////////////////////////////////////////
					cont.find( '.buttons' ).find( '.block' ).click( function( e ) {
						var id = $( this ).parent().attr( 'id' );
						var blocking = $( this ).attr( 'blocking' );

						var conf = confirm( ( blocking == 1 ) ? chrome.i18n.getMessage( 'i18n_0144' ) : chrome.i18n.getMessage( 'i18n_0139' ) );

						if ( conf )
						{
							var param = {
								type: 'POST',
								url: ApiUrl( '1.1' ) + 'blocks/' + ( ( blocking == 1 ) ? 'destroy' : 'create' ) + '.json',
								data: {
									screen_name: cp.param['screen_name'],
								},
							};

							Blackout( true );
							$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

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
										if ( blocking == 1 )
										{
											cont.find( '.buttons' ).find( '.block' ).attr( 'blocking', 0 ).html( chrome.i18n.getMessage( 'i18n_0140' ) );

											if ( g_cmn.account[cp.param['account_id']].notsave.blockusers != undefined )
											{
												for ( var i = 0, _len = g_cmn.account[cp.param['account_id']].notsave.blockusers.length ; i < _len ; i++ )
												{
													if ( id == g_cmn.account[cp.param['account_id']].notsave.blockusers[i] )
													{
														g_cmn.account[cp.param['account_id']].notsave.blockusers.splice( i, 1 );
														break;
													}
												}
											}
										}
										else
										{
											cont.find( '.buttons' ).find( '.block' ).attr( 'blocking', 1 ).html( chrome.i18n.getMessage( 'i18n_0146' ) );

											if ( g_cmn.account[cp.param['account_id']].notsave.blockusers != undefined )
											{
												g_cmn.account[cp.param['account_id']].notsave.blockusers.push( id );
											}
										}
									}
									else
									{
										ApiError( ( blocking == 1 ) ? chrome.i18n.getMessage( 'i18n_0145' ) : chrome.i18n.getMessage( 'i18n_0141' ), res );
									}

									Blackout( false );
									$( '#blackout' ).activity( false );
								}
							);
						}

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// スパム報告クリック処理
					////////////////////////////////////////
					cont.find( '.buttons' ).find( '.spam' ).click( function( e ) {
						var conf = confirm( chrome.i18n.getMessage( 'i18n_0184' ) );

						if ( conf )
						{
							var param = {
								type: 'POST',
								url: ApiUrl( '1.1' ) + 'users/report_spam.json',
								data: {
									screen_name: cp.param['screen_name'],
								},
							};

							Blackout( true );
							$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

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
									}
									else
									{
										ApiError( chrome.i18n.getMessage( 'i18n_0072' ), res );
									}

									Blackout( false );
									$( '#blackout' ).activity( false );
								}
							);
						}

						e.stopPropagation();
					} );

					////////////////////////////////////////
					// 検索メモクリック処理
					////////////////////////////////////////
					cont.find( '.buttons' ).find( '.saved_search' ).click( function( e ) {
						var _cp = new CPanel( null, null, 300, 300 );
						_cp.SetType( 'saved_search' );
						_cp.SetParam( {
							account_id: cp.param['account_id'],
						} );
						_cp.Start();

						e.stopPropagation();
					} );
				}
				else
				{
					ApiError( chrome.i18n.getMessage( 'i18n_0160' ), res );
					p.find( '.close' ).trigger( 'click', [false] );
				}

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
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
		// アカウント変更
		////////////////////////////////////////
		cont.on( 'account_change', function( e, account_id ) {
			if ( cp.param['account_id'] == account_id )
			{
			}
			else
			{
				p.find( 'div.titlebar' ).find( '.titlename' ).text( g_cmn.account[account_id].screen_name );
				cp.param['account_id'] = account_id;

				cp.title = cp.title.replace( /(<span class=\"titlename\">).*(<\/span>)/,
					'$1' + g_cmn.account[account_id].screen_name + '$2' );

				// パネルリストの更新"
				$( document ).trigger( 'panellist_changed' );

				// 更新
				ShowMake();
			}
		} );

		////////////////////////////////////////
		// アカウント情報更新
		////////////////////////////////////////
		cont.on( 'account_update', function() {
			AccountAliveCheck();

			// アカウント選択リスト更新
			var s = '';
			var id;

			for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
			{
				id = g_cmn.account_order[i];
				s += '<span account_id="' + id + '">' + g_cmn.account[id].screen_name + '</span>';
			}

			p.find( 'div.titlebar' ).find( '.titlename_list' ).html( s )
				.find( 'span' ).click( function( e ) {
					p.find( 'div.contents' ).trigger( 'account_change', [$( this ).attr( 'account_id' )] );
					$( this ).parent().hide();
				} );
		} );

		if ( !AccountAliveCheck() )
		{
			return;
		}

		ShowMake();
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
