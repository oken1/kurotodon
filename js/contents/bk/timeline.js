"use strict";

////////////////////////////////////////////////////////////////////////////////
// タイムライン表示
////////////////////////////////////////////////////////////////////////////////
Contents.timeline = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var lines = cont.find( '.lines' );
	var setting = cont.find( '.setting' );
	var setting_show = false;
	var timeline_list;
	var badge;
	var newitems = $();
	var tm = null;
	var status_ids = {};
	var first_status_id = null;
	var last_status_id = null;
	var page = 1;
	var scrollPos = null;
	var scrollHeight = null;
	var loading = false;
	var stream_queue = new Array();
	var cursor_on_option = false;
	var thumb_queue = new Array();

	var quote_cache = {};

	////////////////////////////////////////////////////////////
	// 読み込み済みステータスID数を取得
	////////////////////////////////////////////////////////////
	var StatusIDCount = function() {
		var cnt = 0;

		for ( var id in status_ids )
		{
			cnt++;
		}

		return cnt;
	}

	////////////////////////////////////////
	// 引用元キャッシュに追加
	////////////////////////////////////////
	var AddQuoteCache = function( json ) {
		if ( json.quoted_status )
		{
			quote_cache[json.quoted_status.id_str] = {
				status_id: json.quoted_status.id_str,
				screen_name: json.quoted_status.user.screen_name,
				name: json.quoted_status.user.name,
				text: twemoji.parse( json.quoted_status.text ),
			};
		}
	}

	////////////////////////////////////////
	// 返信元展開処理
	////////////////////////////////////////
	var OpenReplyTweet = function( img, auto_reply, wait, start )
	{
		if ( auto_reply == 0 )
		{
			return;
		}

		var in_reply_to = img.parent();
		var item = in_reply_to.parent().parent().parent().parent();

		auto_reply--;

		in_reply_to.hide();

		var MakeReplyTweet = function( json, wait )
		{
			item.after( MakeTimeline( json, cp.param['account_id'] ) );

			// ハッシュタグプルダウンを更新
			if ( json.entities.hashtags.length ) {
				$( 'div.contents' ).trigger( 'hashtag_pulldown_update' );
			}

			if ( g_cmn.cmn_param['auto_thumb'] )
			{
				OpenThumbnail( item.next( 'div.item' ), false );
			}

			$( '#tooltip' ).hide();

			// 一番上の場合は返信元を閉じるアイコンを表示
			if ( !item.hasClass( 'res' ) )
			{
				item.find( '.in_reply_to_close' ).show();
			}

			var resitem = item.next();
			resitem.addClass( 'res' );

			item.addClass( 'resopen' );

			// 返信元はアイコンを右に表示
			resitem.append( '<div class="tail"></div>' );
			resitem.find( '.icon' ).clone().appendTo( resitem );
			resitem.find( '.icon:first-child' ).remove();

			// しおりなし
			resitem.find( '.bookmark' ).remove();

			// アイコンサイズ
			resitem.find( '.icon' ).css( { width: g_cmn.cmn_param['iconsize'] } )
				.find( '> img' ).css( { width: g_cmn.cmn_param['iconsize'], height: g_cmn.cmn_param['iconsize'] } )
				.end()
				.find( '.retweet img' ).css( { width: g_cmn.cmn_param['iconsize'] * 0.7, height: g_cmn.cmn_param['iconsize'] * 0.7 } );

			// ユーザーごとのアイコンサイズ適用
			SetUserIconSize( resitem );

			// 引用元表示
			QuoteSource( resitem );

			// 自動展開数分繰り返し
			if ( resitem.find( '.in_reply_to' ).length > 0 )
			{
				OpenReplyTweet( resitem.find( '.in_reply_to .resicon' ), auto_reply, wait, false );
			}
		};

		setTimeout( function() {
			var param = {
				type: 'GET',
				url: ApiUrl( '1.1' ) + 'statuses/show/' + in_reply_to.attr( 'status_id' ) + '.json',
				data: {
					include_entities: true,
					tweet_mode: 'extended',
				},
			};

			lines.activity( { color: '#ffffff' } );

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
						if ( param.data.tweet_mode == 'extended' )
						{
						console.log( res );
							res.json = ConvertExtendedTweet( res.json, 'normal' );
						console.log( res );
						}

						// 引用元付きのときはキャッシュに追加
						AddQuoteCache( res.json );

						MakeReplyTweet( res.json, wait );
					}
					else
					{
						ApiError( chrome.i18n.getMessage( 'i18n_0275' ), res );

						in_reply_to.show();
					}

					lines.activity( false );

					$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
				}
			);
		}, ( start ) ? 1 : wait );
	};

	///////////////////////////////////////////////////////////////////
	// ツールバーユーザー/グループ設定/ツイ消しカードの情報を最新に更新
	///////////////////////////////////////////////////////////////////
	var UserInfoUpdate = function( users ) {
		var idx;
		var updflg = false;

		for ( var user_id in users )
		{
			// ツールバーユーザー
			for ( var idx = 0, _len = g_cmn.toolbar_user.length ; idx < _len ; idx++ )
			{
				if ( g_cmn.toolbar_user[idx].user_id == user_id )
				{
					// 日付が新しい場合のみ
					var datechk = false;

					if ( g_cmn.toolbar_user[idx].created_at == undefined )
					{
						datechk = true;
					}
					else
					{
						if ( DateConv( g_cmn.toolbar_user[idx].created_at, 0 ) < DateConv( users[user_id].created_at, 0 ) )
						{
							datechk = true;
						}
					}

					if ( datechk )
					{
						var chk = false;

						// アイコンに変更がないか？
						if ( g_cmn.toolbar_user[idx].icon != users[user_id].icon )
						{
							g_cmn.toolbar_user[idx].icon = users[user_id].icon;
							chk = true;
						}

						// スクリーン名に変更がないか？
						if ( g_cmn.toolbar_user[idx].screen_name != users[user_id].screen_name )
						{
							g_cmn.toolbar_user[idx].screen_name = users[user_id].screen_name;
							chk = true;
						}

						// 変更があったら日付を更新
						if ( chk )
						{
							updflg = true;
							g_cmn.toolbar_user[idx].created_at = users[user_id].created_at;
						}
					}
				}
			}

			// グループ設定
			for ( var group_id in g_cmn.group_panel )
			{
				if ( g_cmn.group_panel[group_id].param['users'][user_id] != undefined )
				{
					// 日付が新しい場合のみ
					var datechk = false;

					if ( g_cmn.group_panel[group_id].param['users'][user_id].created_at == undefined )
					{
						datechk = true;
					}
					else
					{
						if ( DateConv( g_cmn.group_panel[group_id].param['users'][user_id].created_at, 0 ) < DateConv( users[user_id].created_at, 0 ) )
						{
							datechk = true;
						}
					}

					if ( datechk )
					{
						var chk = false;

						// アイコンに変更がないか？
						if ( g_cmn.group_panel[group_id].param['users'][user_id].icon != users[user_id].icon )
						{
							g_cmn.group_panel[group_id].param['users'][user_id].icon = users[user_id].icon;
							chk = true;
						}

						// スクリーン名に変更がないか？
						if ( g_cmn.group_panel[group_id].param['users'][user_id].screen_name != users[user_id].screen_name )
						{
							g_cmn.group_panel[group_id].param['users'][user_id].screen_name = users[user_id].screen_name;
							chk = true;
						}

						// 変更があったら日付を更新
						if ( chk )
						{
							g_cmn.group_panel[group_id].param['users'][user_id].created_at = users[user_id].created_at;
						}
					}
				}
			}

			// ツイ消しカード
			for ( var idx = 0, _len = g_cmn.twdelete_history.length ; idx < _len ; idx++ )
			{
				if ( g_cmn.twdelete_history[idx].user_id == user_id )
				{
					// 日付が新しい場合のみ
					var datechk = false;

					if ( DateYYYYMMDD( g_cmn.twdelete_history[idx].date, 4 ) < DateConv( users[user_id].created_at, 0 ) )
					{
						datechk = true;
					}

					if ( datechk )
					{
						if ( g_cmn.twdelete_history[idx].icon != users[user_id].icon )
						{
							g_cmn.twdelete_history[idx].icon = users[user_id].icon;
						}

						if ( g_cmn.twdelete_history[idx].screen_name != users[user_id].screen_name )
						{
							g_cmn.twdelete_history[idx].screen_name = users[user_id].screen_name;
						}
					}
				}
			}
		}

		if ( updflg )
		{
			UpdateToolbarUser();
		}
	};

	////////////////////////////////////////////////////
	// 宛先を抽出してツイートパネルにセット
	////////////////////////////////////////////////////
	var ExtractReplyUser = function( item ) {
		var text = item.find( '.tweet' ).find( '.tweet_text' ).text();

		var users = text.match( /@[0-9a-zA-Z_]+/g );

		if ( users == null )
		{
			users = new Array();
		}

		var pid = IsUnique( 'tweetbox' );

		var SetRep = function() {
			for ( var i = users.length - 1; i >= 0 ; i-- )
			{
				var screen_name = users[i].replace( /^@/, '' );

				// 自分は除外
				if ( screen_name == g_cmn.account[cp.param['account_id']].screen_name )
				{
					continue;
				}

				// このツイートのユーザーも除外
				if ( screen_name == item.attr( 'screen_name' ) )
				{
					continue;
				}

				$( '#' + pid ).find( 'div.contents' ).trigger( 'userset', [screen_name] );
			}
		};

		// ツイートパネルが開いていない場合は開く
		if ( pid == null )
		{
			var _cp = new CPanel( null, null, 324, 240 );
			_cp.SetType( 'tweetbox' );
			_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0083' ), false );
			_cp.SetParam( { account_id: cp.param['account_id'], maxlen: 140, } );
			_cp.Start( function() {
				pid = IsUnique( 'tweetbox' );
				SetRep();
				$( '#' + pid ).find( 'div.contents' ).trigger( 'userset', [item.attr( 'screen_name' )] );
			} );
		}
		else
		{
			SetRep();
			$( '#' + pid ).find( 'div.contents' ).trigger( 'userset', [item.attr( 'screen_name' )] );
			GetPanel( pid ).param.account_id = cp.param['account_id'];
			$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );
		}
	};

	////////////////////////////////////////////////////////////
	// 引用元表示
	////////////////////////////////////////////////////////////
	var QuoteSource = function( items ) {
		if ( items == null )
		{
			return;
		}

		var cnt_items = 0;

		// ツイート数分ループ
		var _GetAnchor = function() {
			if ( cnt_items == items.length )
			{
				return;
			}

			// すでに表示済み？
			if ( $( items[cnt_items] ).hasClass( 'quote_showed' ) )
			{
				cnt_items++;
				_GetAnchor();
				return;
			}

			var anchors = $( items[cnt_items] ).find( 'div.tweet > div.tweet_text a.anchor' );
			var cnt_anchors = 0;

			// アンカー数分ループ
			var _GetQuoteTweet = function() {
				if ( cnt_anchors == anchors.length )
				{
					$( items[cnt_items] ).addClass( 'quote_showed' );
					cnt_items++;
					_GetAnchor();
					return;
				}

				if ( $( anchors[cnt_anchors] ).attr( 'href' ).match( /^https?:\/\/(mobile\.)*twitter\.com\/(#!\/)?(\w+)\/status(es)?\/(\d+)(\?.+)?$/ ) )
				{
					var status_id = RegExp.$5;

					// 表示処理
					var _ShowQuoteSource = function( status_id ) {
						if ( status_id )
						{
							var qc = quote_cache[status_id];

							qc.text = qc.text.replace( /\n/g, '<br>' );

							var html = OutputTPL( 'timeline_quote', {
								name: qc.name,
								screen_name: qc.screen_name,
								text: qc.text,
								namedisp: g_namedisp,
							} );

							if ( $( items[cnt_items] ).find( '.tweet_quote' ).length )
							{
								$( items[cnt_items] ).find( '.tweet_quote:last' ).after( html );
							}
							else
							{
								$( items[cnt_items] ).find( '.tweet_text' ).after( html );
							}
						}

						cnt_anchors++;
						_GetQuoteTweet();
					};

					if ( quote_cache[status_id] != null )
					{
						_ShowQuoteSource( status_id );
					}
					else
					{
						var param = {
							type: 'GET',
							url: ApiUrl( '1.1' ) + 'statuses/show/' + status_id + '.json',
							data: {
								include_entities: true,
        						tweet_mode: 'extended',
							},
						};

						lines.activity( { color: '#ffffff' } );

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
            						if ( param.data.tweet_mode == 'extended' )
			            			{
            							res.json = ConvertExtendedTweet( res.json, 'normal' );
			            			}

									quote_cache[res.json.id_str] = {
										status_id: res.json.id_str,
										screen_name: res.json.user.screen_name,
										name: res.json.user.name,
										text: twemoji.parse( res.json.text ),
									};

									_ShowQuoteSource( res.json.id_str );
								}
								else
								{
									_ShowQuoteSource( null );
								}

								lines.activity( false );

								$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
							}
						);
					}
				}
				else
				{
					cnt_anchors++;
					_GetQuoteTweet();
				}
			};

			_GetQuoteTweet();
		};

		_GetAnchor();
	};

	////////////////////////////////////////////////////////////
	// 一覧作成
	////////////////////////////////////////////////////////////
	var ListMake = function( count, type ) {
		var param = {};

		switch ( cp.param['timeline_type'] )
		{
			// ホーム
			case 'home':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'statuses/home_timeline.json',
					data: {
						count: count,
						include_entities: true,
						tweet_mode: 'extended',
					},
				};

				break;
			// Mention
			case 'mention':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'statuses/mentions_timeline.json',
					data: {
						count: count,
						include_entities: true,
						tweet_mode: 'extended',
					},
				};

				break;
			// ユーザ
			case 'user':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'statuses/user_timeline.json',
					data: {
						count: count,
						screen_name: cp.param['screen_name'],
						include_rts: true,
						include_entities: true,
						tweet_mode: 'extended',
					},
				};

				break;
			// リスト
			case 'list':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'lists/statuses.json',
					data: {
						count: count,
						include_entities: true,
						include_rts: true,
						tweet_mode: 'extended',
					},
				};

				if ( cp.param['list_id'] )
				{
					param.data.list_id = cp.param['list_id'];
				}
				else
				{
					param.data.owner_screen_name = cp.param['screen_name'];
					param.data.slug = cp.param['slug'];
					param.data.name = cp.param['name'];
				}

				break;
			// 検索
			case 'search':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'search/tweets.json',
					data: {
						count: count,
						q: cp.param['q'],
						include_entities: true,
						include_rts: false,
						tweet_mode: 'extended',
					},
				};

				// 検索対象言語を日本語のみにする
				if ( cp.param['search_lang'] == 1 )
				{
					param.data.lang = 'ja';
				}

				// リツイートを除外する
				if ( g_cmn.cmn_param['exclude_retweets'] == 1 )
				{
					param.data.q += ' exclude:retweets';
				}

				break;
			// DM(受信)
			case 'dmrecv':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'direct_messages.json',
					data: {
						count: count,
						include_entities: true,
						full_text: true,
					},
				};

				break;
			// DM(送信)
			case 'dmsent':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'direct_messages/sent.json',
					data: {
						count: count,
						include_entities: true,
						full_text: true,
					},
				};

				break;
			// お気に入り
			case 'favorites':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'favorites/list.json',
					data: {
						screen_name: cp.param['screen_name'],
						include_entities: true,
						tweet_mode: 'extended',
					},
				};

				break;
			// グループストリーム
			case 'group':
				// 何もしない
				setTimeout( function() { cont.trigger( 'contents_resize' ); }, 1 );

				return;
			// 一件だけ表示
			case 'perma':
				param = {
					type: 'GET',
					url: ApiUrl( '1.1' ) + 'statuses/show/' + cp.param['status_id'] + '.json',
					data: {
						include_entities: true,
						tweet_mode: 'extended',
					},
				};

				break;
		}

		switch ( type )
		{
			// 初期
			case 'init':
				loading = true;
				stream_queue = [];
				status_ids = {};

				break;
			// 更新
			case 'reload':
				loading = true;
				stream_queue = [];
				status_ids = {};

				break;
			// 新着
			case 'new':
				if ( last_status_id == null )
				{
					// 一度も読み込んでいない場合は、初期として扱う
					type = 'init';
					status_ids = {};
				}
				else
				{
					param.data.since_id = last_status_id;
				}
				break;
			// もっと読む
			case 'old':
				param.data.max_id = first_status_id;
				break;
		}

		lines.activity( { color: '#ffffff' } );

		// API呼び出し
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
					var s = '';
					var json = res.json;
					var assign = {};
					var text = '';
					var len;
					var addcnt = 0;
					var users = {};

					// 検索、DM、お気に入り、1件だけ以外
					if ( cp.param['timeline_type'] != 'search' &&
						 cp.param['timeline_type'] != 'dmrecv' &&
						 cp.param['timeline_type'] != 'dmsent' &&
						 cp.param['timeline_type'] != 'favorites' &&
						 cp.param['timeline_type'] != 'perma' )
					{
						len = json.length;

						for ( var i = 0 ; i < len ; i++ )
						{
							if ( !json[i].user )
							{
								continue;
							}

							if ( param.data.tweet_mode == 'extended' )
							{
								json[i] = ConvertExtendedTweet( json[i], 'normal' );
							}

							// 引用元付きのときはキャッシュに追加
							AddQuoteCache( json[i] );

							// 既に読み込み済みのツイート/非表示ユーザは無視
							if ( status_ids[json[i].id_str] == undefined )
							{
								if ( IsNGTweet( json[i], 'normal' ) == false )
								{
									s += MakeTimeline( json[i], cp.param['account_id'] );
									status_ids[json[i].id_str] = true;
									addcnt++;

									if ( users[json[i].user.id_str] == undefined )
									{
										users[json[i].user.id_str] = {
											icon: json[i].user.profile_image_url_https,
											screen_name: json[i].user.screen_name,
											created_at: json[i].created_at,
										};
									}
								}
							}
						}

						if ( len > 0 )
						{
							// 一番古いツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'old' )
							{
								first_status_id = json[len - 1].id_str;
							}

							// 一番新しいツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'new' )
							{
								last_status_id = json[0].id_str;
							}
						}
					}
					// 検索
					else if ( cp.param['timeline_type'] == 'search' )
					{
						len = json.statuses.length;
						for ( var i = 0 ; i < len ; i++ )
						{
							if ( !json.statuses[i].user )
							{
								continue;
							}

							if ( param.data.tweet_mode == 'extended' )
							{
								json.statuses[i] = ConvertExtendedTweet( json.statuses[i], 'search' );
							}

							// 引用元付きのときはキャッシュに追加
							AddQuoteCache( json.statuses[i] );

							// 既に読み込み済みのツイート/非表示ユーザは無視
							if ( status_ids[json.statuses[i].id_str] == undefined )
							{
								if ( IsNGTweet( json.statuses[i], 'search' ) == false )
								{
									s += MakeTimeline( json.statuses[i], cp.param['account_id'] );
									status_ids[json.statuses[i].id_str] = true;
									addcnt++;

									if ( users[json.statuses[i].user.id_str] == undefined )
									{
										users[json.statuses[i].user.id_str] = {
											icon: json.statuses[i].user.profile_image_url_https,
											screen_name: json.statuses[i].user.screen_name,
											created_at: json.statuses[i].created_at,
										};
									}
								}
							}
						}

						if ( len > 0 )
						{
							// 一番古いツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'old' )
							{
								first_status_id = json.statuses[len - 1].id_str;
							}

							// 一番新しいツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'new' )
							{
								last_status_id = json.statuses[0].id_str;
							}
						}
					}
					// DM
					else if ( cp.param['timeline_type'] == 'dmrecv' ||
							  cp.param['timeline_type'] == 'dmsent' )
					{
						len = json.length;
						for ( var i = 0 ; i < len ; i++ )
						{
							var sendrec = ( cp.param['timeline_type'] == 'dmrecv' ) ? json[i].sender : json[i].recipient;

							// 既に読み込み済みのツイート/非表示ユーザは無視
							if ( status_ids[json[i].id_str] == undefined )
							{
								if ( IsNGTweet( json[i], cp.param['timeline_type'] ) == false )
								{
									s += MakeTimeline_DM( json[i], cp.param['timeline_type'], cp.param['account_id'] );
									status_ids[json[i].id_str] = true;
									addcnt++;

									if ( users[sendrec.id_str] == undefined )
									{
										users[sendrec.id_str] = {
											icon: sendrec.profile_image_url_https,
											screen_name: sendrec.screen_name,
											created_at: sendrec.created_at,
										};
									}
								}
							}
						}

						if ( len > 0 )
						{
							// 一番古いツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'old' )
							{
								first_status_id = json[len - 1].id_str;
							}

							// 一番新しいツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'new' )
							{
								last_status_id = json[0].id_str;
							}
						}
					}
					// お気に入り
					else if ( cp.param['timeline_type'] == 'favorites' )
					{
						len = json.length;

						for ( var i = 0 ; i < len ; i++ )
						{
							if ( param.data.tweet_mode == 'extended' )
							{
								json[i] = ConvertExtendedTweet( json[i], 'favorite' );
							}

							// 引用元付きのときはキャッシュに追加
							AddQuoteCache( json[i] );

							// 既に読み込み済みのツイート/非表示ユーザは無視
							if ( status_ids[json[i].id_str] == undefined )
							{
								if ( IsNGTweet( json[i], 'normal' ) == false )
								{
									s += MakeTimeline( json[i], cp.param['account_id'] );
									status_ids[json[i].id_str] = true;
									addcnt++;

									if ( users[json[i].user.id_str] == undefined )
									{
										users[json[i].user.id_str] = {
											icon: json[i].user.profile_image_url_https,
											screen_name: json[i].user.screen_name,
											created_at: json[i].created_at,
										};
									}
								}
							}
						}

						if ( len > 0 )
						{
							// 一番古いツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'old' )
							{
								first_status_id = json[len - 1].id_str;
							}

							// 一番新しいツイートのID更新
							if ( type == 'init' || type == 'reload' || type == 'new' )
							{
								last_status_id = json[0].id_str;
							}
						}
					}
					// 一件だけ
					else if ( cp.param['timeline_type'] == 'perma' )
					{
						len = 0;

						if ( param.data.tweet_mode == 'extended' )
						{
							json = ConvertExtendedTweet( json, 'show' );
						}

						// 引用元付きのときはキャッシュに追加
						AddQuoteCache( json );

						if ( IsNGTweet( json, 'normal' ) == false )
						{
							s += MakeTimeline( json, cp.param['account_id'] );
							status_ids[json.id_str] = true;
							addcnt++;

							if ( users[json.user.id_str] == undefined )
							{
								users[json.user.id_str] = {
									icon: json.user.profile_image_url_https,
									screen_name: json.user.screen_name,
									created_at: json.created_at,
								};
							}
						}
					}

					// ハッシュタグプルダウンを更新
					$( 'div.contents' ).trigger( 'hashtag_pulldown_update' );

					// もっと読む
					var AppendReadmore = function() {
						if ( len > 0 )
						{
							timeline_list.append(
								'<div class="btn img readmore icon-arrow_down tooltip" tooltip="' + chrome.i18n.getMessage( 'i18n_0157' ) + '"></div>' );
						}
					};

					// サムネイル表示&URL展開先読み
					var Thumb_Urls = function( items ) {
						timeline_list.find( items ).each( function( idx ) {
							var item = $( this );

							// サムネイル表示
							if ( g_cmn.cmn_param['auto_thumb'] )
							{
								OpenThumbnail( item, false );
							}
						} );
					};

					UserInfoUpdate( users );

					var items = null;

					switch ( type )
					{
						// 初期、更新
						case 'init':
						case 'reload':
							timeline_list.html( s );
							timeline_list.scrollTop( 0 );

							AppendReadmore();

							Thumb_Urls( 'div.item' );

							badge.hide().html( '' );
							$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( '' );

							// 検索結果1件以上ある場合のみ、条件保存ボタンを有効化
							if ( len > 0 )
							{
								lines.find( '.panel_btns' ).find( '.timeline_savesearch' ).removeClass( 'disabled' );
							}

							items = timeline_list.find( 'div.item' );

							break;
						// 新着
						case 'new':
							if ( addcnt > 0 )
							{
								var _scheight = timeline_list.prop( 'scrollHeight' );
								var _sctop = timeline_list.scrollTop();

								timeline_list.prepend( s );

								// 新着ツイートにスクロールする
								if ( g_cmn.cmn_param['newscroll'] == 1 && _sctop == 0 )
								{
								}
								else
								{
									var scheight = timeline_list.prop( 'scrollHeight' );
									timeline_list.scrollTop( _sctop + ( scheight - _scheight ) );
								}

								timeline_list.find( '> div.item:lt(' + addcnt + ')' ).addClass( 'new' );
								newitems = $( timeline_list.find( '> div.item.new' ).get() );
								items = newitems;

								// 新着件数
								badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
								$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();

								timeline_list.trigger( 'scroll' );

								// notification
								var img = {};

								img['home'] = 'icon-home';
								img['mention'] = 'icon-at';
								img['user'] = 'icon-user';
								img['list'] = 'icon-list';
								img['search'] = 'icon-search';
								img['dmrecv'] = 'icon-envelop';
								img['dmsent'] = 'icon-envelop';

								// タイトルからtitlenameのタグを外す
								if ( cp.param['notify_new'] == 1 )
								{
									Notification( 'new', {
										img: img[cp.param['timeline_type']],
										simg: g_cmn.account[cp.param['account_id']].icon,
//										user: escapeHTML( cp.title.replace( /<span class=\"titlename\">(.*)<\/span>/, '$1' ) ),
										user: cp.title.replace( /<span class=\"titlename\">(.*)<\/span>/, '$1' ),
										count: addcnt,
										date: DateYYYYMMDD( null, 4 ),
									} );
								}

								// "表示最大数を超えている件数
								var itemcnt = StatusIDCount();

								if ( itemcnt - cp.param['max_count'] > 0 )
								{
									// 新着で読み込んだ分だけ削除
									timeline_list.find( '> div.item:gt(' + ( itemcnt - addcnt - 1 ) + ')' ).each( function() {
										delete status_ids[$( this ).attr( 'status_id' )];
//										timeline_list.scrollTop( timeline_list.scrollTop() - $( this ).outerHeight() );
										$( this ).remove();
									} );

									first_status_id = timeline_list.find( '> div.item:last' ).attr( 'status_id' );
								}
							}

							break;
						// もっと読む
						case 'old':
							var itemcnt = timeline_list.find( '> div.item:not(".res")' ).length;

							if ( addcnt > 0 )
							{
								timeline_list.append( s );

								AppendReadmore();
							}

							timeline_list.find( '.readmore:first' ).remove();
							$( '#tooltip' ).hide();

							Thumb_Urls( '> div.item:not(".res"):gt(' + ( itemcnt - 1 ) + ')' );

							items = timeline_list.find( '> div.item:not(".res"):gt(' + ( itemcnt - 1 ) + ')' );
							break;
					}

					// アイコンサイズ
					if ( items != null )
					{
						cont.trigger( 'contents_resize' );

						items.find( 'div.icon' ).css( { width: g_cmn.cmn_param['iconsize'] } )
							.find( '> img' ).css( { width: g_cmn.cmn_param['iconsize'], height: g_cmn.cmn_param['iconsize'] } )
							.end()
							.find( '.retweet img' ).css( { width: g_cmn.cmn_param['iconsize'] * 0.7, height: g_cmn.cmn_param['iconsize'] * 0.7 } );

						// ユーザーごとのアイコンサイズ適用
						SetUserIconSize( items );
					}

					// 引用元表示
					QuoteSource( items );

					// しおり
					if ( cp.param['bookmark'][0] )
					{
						timeline_list.find( '> div.item[status_id=' + cp.param['bookmark'][0] + ']' ).find( '.bookmark' ).removeClass( 'nomark' ).addClass( 'mark1' );
					}
				}
				else
				{
					// 鍵付きアカウントの場合はユーザー情報パネルを代わりに開く
					if ( cp.param['timeline_type'] == 'user' && ( type == 'init' || type == 'reload' ) && res.status == 401 )
					{
						// パネルを閉じる
						p.find( '.close' ).trigger( 'click', [false] );

						OpenUserShow( cp.param['screen_name'],
							'',
							cp.param['account_id'] );

						MessageBox( chrome.i18n.getMessage( 'i18n_0286' ) );
						return;
					}

					// もっと読むで404の場合
					if ( type == 'old' && res.status == 404 )
					{
						timeline_list.find( '.readmore:first' ).remove();
						$( '#tooltip' ).hide();
					}
					else
					{
						ApiError( escapeHTML( cp.title.replace( /<span class=\"titlename\">(.*)<\/span>/, '$1' ) ) + chrome.i18n.getMessage( 'i18n_0011' ), res );

						if ( type == 'old' )
						{
							timeline_list.find( '.readmore' ).removeClass( 'disabled' );
						}
					}
				}

				// "検索の場合タイトルを更新
				if ( cp.param['timeline_type'] == 'search' && ( type == 'init' || type == 'reload' ) )
				{
					cp.SetTitle( chrome.i18n.getMessage( 'i18n_0105', [cp.param['q']] ) +
						' (<span class="titlename">' + g_cmn.account[cp.param['account_id']].screen_name + '</span>)', true );

					lines.find( '.panel_btns' ).find( '.searchagain_text' ).val( cp.param['q'] );

					if ( lines.find( '.panel_btns' ).find( '.searchagain_text' ).val().length > 0 )
					{
						lines.find( '.panel_btns' ).find( '.timeline_searchagain' ).removeClass( 'disabled' );
					}
					else
					{
						lines.find( '.panel_btns' ).find( '.timeline_searchagain' ).addClass( 'disabled' );
					}
				}

				lines.activity( false );
				loading = false;

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );

				// ストリームキューに溜まっているデータを出力
				if ( stream_queue.length > 0 )
				{
					for ( var i = 0, _len = stream_queue.length ; i < _len ; i++ )
					{
						cont.trigger( 'getstream', [stream_queue[i]] );
					}

					stream_queue = [];
				}
			}
		);
	};

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		////////////////////////////////////////
		// 最小化/設定切替時のスクロール位置
		// 保存/復元
		////////////////////////////////////////
		cont.on( 'contents_scrollsave', function( e, type ) {
			// 保存
			if ( type == 0 )
			{
				if ( scrollPos == null && scrollHeight == null )
				{
					scrollPos = timeline_list.scrollTop();
					scrollHeight = timeline_list.prop( 'scrollHeight' );
				}
			}
			// 復元
			else
			{
				// タイムラインが表示されている場合のみ
				if ( scrollPos != null && scrollHeight != null && !setting_show )
				{
					if ( scrollHeight != 0 )
					{
						timeline_list.scrollTop( scrollPos + ( timeline_list.prop( 'scrollHeight' ) - scrollHeight ) );
					}

					scrollPos = null;
					scrollHeight = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			timeline_list.height( cont.height() - cont.find( '.panel_btns' ).height() - 1 )
					.trigger( 'scroll' );

			setting.find( '.tlsetting_items' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

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
				lines.find( '.panel_btns' ).find( '.timeline_reload' ).trigger( 'click' );
			}
		} );

		////////////////////////////////////////
		// このパネルを開いたアカウントが
		// 削除された場合
		////////////////////////////////////////
		var AccountAliveCheck = function() {
			if ( g_cmn.account[cp.param['account_id']] == undefined )
			{
				// グループストリームの場合は閉じない
				if ( cp.param['timeline_type'] == 'group' )
				{
					cp.param['account_id'] = '';

					var _id = cp.id.replace( /^panel_/, '' );

					g_cmn.group_panel[_id] = {
						id: _id,
						param: cp.param,
					};

					return true;
				}
				else
				{
					// パネルを閉じる
					p.find( '.close' ).trigger( 'click', [false] );
					return false;
				}
			}

			return true;
		};

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

			// グループ設定のアカウント一覧を更新
			if ( cp.param['timeline_type'] == 'group' )
			{
				var cur_sel = '';
				var acclist = setting.find( '.acclist' );

				acclist.find( 'div.selected' ).each( function() {
					cur_sel = $( this ).attr( 'account_id' );
				} );

				acclist.html( '' );

				var account_id;

				for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
				{
					account_id = g_cmn.account_order[i];

					acclist.append( OutputTPL( 'tlsetting_accsel', { item: g_cmn.account[account_id], account_id: account_id } ) );

					if ( account_id == cur_sel )
					{
						acclist.find( 'div:last' ).addClass( 'selected' );
					}
				}

				acclist.find( 'div' ).on( 'click', function( e ) {
					acclist.find( 'div' ).removeClass( 'selected' );
					$( this ).addClass( 'selected' );

					if ( $( this ).attr( 'account_id' ) != cp.param['account_id'] )
					{
						setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
					}
				} );
			}
		} );

		////////////////////////////////////////
		// 設定切り替え
		////////////////////////////////////////
		cont.on( 'setting_change', function( e, flg ) {
			setting_show = flg;
		} );

		if ( !AccountAliveCheck() )
		{
			return;
		}

		// 未設定のパラメータに共通パラメータを設定
		if ( cp.param['reload_time'] == undefined )
		{
			cp.param['reload_time'] = g_cmn.cmn_param['reload_time'];
		}

		if ( cp.param['get_count'] == undefined )
		{
			cp.param['get_count'] = g_cmn.cmn_param['get_count'];
		}

		if ( cp.param['max_count'] == undefined )
		{
			cp.param['max_count'] = g_cmn.cmn_param['max_count'];
		}

		if ( cp.param['notify_new'] == undefined )
		{
			cp.param['notify_new'] = g_cmn.cmn_param['notify_new'];
		}

		if ( cp.param['search_lang'] == undefined )
		{
			cp.param['search_lang'] = g_cmn.cmn_param['search_lang'];
		}

		// 全体を作成
		cont.addClass( 'timeline' );
		lines.html( OutputTPL( 'timeline', { type: cp.param['timeline_type'] } ) );

		setting.html( OutputTPL( 'tlsetting', { param: cp.param, uniqueID: GetUniqueID() } ) );

		// タイムラインを表示
		lines.show();
		setting.hide();
		setting_show = false;

		// 設定画面初期化
		SettingInit();

		timeline_list = lines.find( '.timeline_list' );

		// タイトル&ボタン設定
		var account = g_cmn.account[cp.param['account_id']];

		switch ( cp.param['timeline_type'] )
		{
			case 'home':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0152' ) + ' (' + account.screen_name + ')', true );
				cp.SetIcon( 'icon-home' );
				break;
			// Mention
			case 'mention':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0026' ) + ' (' + account.screen_name + ')', true );
				cp.SetIcon( 'icon-at' );
				break;
			// ユーザ
			case 'user':
				cp.SetTitle( cp.param['screen_name'] + ' (<span class="titlename">' + account.screen_name + '</span>)', true );
				cp.SetIcon( 'icon-user' );
				break;
			// リスト
			case 'list':
				// 変更対応前のname値を持っていないパネル対策
				if ( !cp.param['name'] )
				{
					cp.param['name'] = cp.param['slug'];
				}

				if ( cp.param['screen_name'] && cp.param['name'] )
				{
					cp.SetTitle( cp.param['screen_name'] + '/' + cp.param['name'] + ' (' + account.screen_name + ')', true );
					cp.SetIcon( 'icon-list' );
				}
				break;
			// 検索
			case 'search':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0105', [cp.param['q']] ) + ' (<span class="titlename">' + account.screen_name + '</span>)', true );
				cp.SetIcon( 'icon-search' );

				////////////////////////////////////////
				// 検索メモに保存ボタンクリック処理
				////////////////////////////////////////
				lines.find( '.panel_btns' ).find( '.timeline_savesearch' ).click( function( e ) {
					// disabledなら処理しない
					if ( $( this ).hasClass( 'disabled' ) )
					{
						return;
					}

					var param = {
						type: 'POST',
						url: ApiUrl( '1.1' ) + 'saved_searches/create.json',
						data: {
							query: cp.param['q'],
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
							id: cp.param['account_id']
						},
						function( res )
						{
							if ( res.status == 200 )
							{
								g_cmn.account[cp.param['account_id']].notsave.saved_search.push( cp.param['q'] );

								// 検索パネルを開いている場合はプルダウン更新
								var pid = IsUnique( 'searchbox' );

								if ( pid != null )
								{
									$( '#' + pid ).find( 'div.contents' ).trigger( 'account_changed' );
								}
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0211' ), res );
							}

							Blackout( false );
							$( '#blackout' ).activity( false );
						}
					);

					e.stopPropagation();
				} );

				var again_text = lines.find( '.panel_btns' ).find( '.searchagain_text' );
				var again_btn = lines.find( '.panel_btns' ).find( '.timeline_searchagain' );
				var search_btns = lines.find( '.panel_btns' ).find( '.search_btns' );
				var search_btns_btn = lines.find( '.panel_btns' ).find( '.search_btns_btn' );

				////////////////////////////////////////
				// 再検索ボタンクリック処理
				////////////////////////////////////////

				again_text.outerHeight( again_btn.outerHeight() );

				again_btn.click( function( e ) {
					var q = again_text.val();

					// disabledなら処理しない
					if ( $( this ).hasClass( 'disabled' ) || q == '' )
					{
						return;
					}

					cp.param['q'] = q;
					lines.find( '.panel_btns' ).find( '.timeline_reload' ).trigger( 'click' );

					e.stopPropagation();
				} );

				////////////////////////////////////////
				// 入力文字数によるボタン制御
				////////////////////////////////////////
				again_text.on( 'keyup change', function() {
					var slen = $( this ).val().length;

					if ( slen > 0 )
					{
						again_btn.removeClass( 'disabled' );
					}
					else
					{
						again_btn.addClass( 'disabled' );
					}
				} );

				////////////////////////////////////////
				// Enterで検索実行
				////////////////////////////////////////
				again_text.keypress( function( e ) {
					if ( e.keyCode == 13 )
					{
						again_btn.trigger( 'click' );
					}
				} );

				search_btns.hide();

				////////////////////////////////////////
				// 検索専用ボタン群開閉
				////////////////////////////////////////
				search_btns_btn.click( function( e ) {
					search_btns.toggle();
					again_text.focus();

					e.stopPropagation();
				} );

				break;
			// DM(受信)
			case 'dmrecv':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0021' ) + ' (' + account.screen_name + ')', true );
				cp.SetIcon( 'icon-envelop' );

				////////////////////////////////////////
				// 送信済みDMボタンクリック処理
				////////////////////////////////////////
				lines.find( '.timeline_dmsent' ).click( function( e ) {
					var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75 );
					_cp.SetType( 'timeline' );
					_cp.SetParam( {
						account_id: cp.param['account_id'],
						timeline_type: 'dmsent',
						reload_time: g_cmn.cmn_param['reload_time'],
					} );
					_cp.Start();

					e.stopPropagation();
				} );

				break;
			// DM(送信)
			case 'dmsent':
				cp.SetTitle( chrome.i18n.getMessage( 'i18n_0251' ) + ' (' + account.screen_name + ')', true );
				cp.SetIcon( 'icon-envelop' );
				break;
			// お気に入り
			case 'favorites':
				cp.SetTitle( cp.param['screen_name'] + chrome.i18n.getMessage( 'i18n_0098' ) + chrome.i18n.getMessage( 'i18n_0054' ) + ' (<span class="titlename">' + account.screen_name + '</span>)', false );
				cp.SetIcon( 'icon-heart' );
				break;
			// グループストリーム
			case 'group':
				cp.SetTitle( cp.param['title'], true );
				cp.SetIcon( 'icon-users' );
				break;
			// 一件だけ表示
			case 'perma':
				cp.SetTitle( cp.param['screen_name'] + '/' + cp.param['status_id'] + ' (<span class="titlename">' + account.screen_name + '</span>)', false );
				cp.SetIcon( 'icon-twitter' );

				// 更新ボタンを非表示
				lines.find( '.panel_btns' ).remove();
				break;
			// その他
			default:
				// パネルを閉じる
				p.find( '.close' ).trigger( 'click', [false] );
				return false;
		}

		// しおり
		if ( cp.param['bookmark'] == undefined )
		{
			cp.param['bookmark'] = new Array();
		}

		// タイトルバーに新着件数表示用のバッジを追加
		badge = p.find( 'div.titlebar' ).find( '.badge' );

		////////////////////////////////////////
		// バッジクリック処理
		////////////////////////////////////////
		badge.click( function( e ) {
			// 最小化しているとき、設定画面を表示しているときは無視
			if ( cp.minimum.minimum == true )
			{
				return;
			}

			if ( setting_show )
			{
				return;
			}

			var lastitem = $( newitems[newitems.length - 1] );
			timeline_list.scrollTop( timeline_list.scrollTop() +
				lastitem.position().top - timeline_list.position().top );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		// TLの流速を表示
		////////////////////////////////////////
		p.find( '.titleicon' ).mouseenter( function( e ) {
			var spd;
			var unit = chrome.i18n.getMessage( 'i18n_0270' );

			var itemcnt = StatusIDCount();

			if ( itemcnt < 1 )
			{
				spd = '--';
				unit = '--';
			}
			else
			{
				//var firstdate = Date.parse( timeline_list.find( '> item:first' ).attr( 'created_at' ).replace( '+', 'GMT+' ) );
				var firstdate = new Date();
				var lastdate = Date.parse( timeline_list.find( '> div.item:last' ).attr( 'created_at' ).replace( '+', 'GMT+' ) );

				spd = itemcnt / ( firstdate - lastdate ) * 1000;

				if ( spd < 0 )
				{
					spd = '--';
					unit = '--';
				}
				else
				{
					// 分速
					if ( spd < 1 )
					{
						spd = spd * 60;
						unit = chrome.i18n.getMessage( 'i18n_0272' );
					}

					// 時速
					if ( spd < 1 )
					{
						spd = spd * 60;
						unit = chrome.i18n.getMessage( 'i18n_0299' );
					}

					// 日速
					if ( spd < 1 )
					{
						spd = spd * 24;
						unit = chrome.i18n.getMessage( 'i18n_0259' );
					}

					// 月速
					if ( spd < 1 )
					{
						spd = spd * 30.41667;
						unit = chrome.i18n.getMessage( 'i18n_0203' );
					}

					// 年速
					if ( spd < 1 )
					{
						spd = spd * 12;
						unit = chrome.i18n.getMessage( 'i18n_0264' );
					}

					spd = Math.floor( spd * 100 ) / 100;
				}
			}

			$( this ).attr( 'tooltip', chrome.i18n.getMessage( 'i18n_0037' ) + ': ' + spd + '/' + unit );
		} );

		////////////////////////////////////////
		// 新着読み込みタイマー開始
		////////////////////////////////////////
		timeline_list.on( 'reload_timer', function() {
			// タイマーを止める
			if ( tm != null )
			{
				clearInterval( tm );
				tm = null;
			}

			// グループストリームの場合はタイマー起動しない
			if ( cp.param['timeline_type'] == 'group' )
			{
				lines.find( '.streamuse' ).css( { display: 'none' } );

				if ( cp.param['account_id'] )
				{
					if ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 )
					{
						lines.find( '.streamuse' ).css( { display: 'inline-block' } );
					}
				}

				return;
			}

			// ユーザーストリームを使うTL
			var tl_stream = ( cp.param['timeline_type'] == 'home' ||
							  cp.param['timeline_type'] == 'mention' ||
							  cp.param['timeline_type'] == 'dmrecv' ||
							  cp.param['timeline_type'] == 'dmsent' );

			// 自動更新なしTL
			var tl_noreload = ( cp.param['timeline_type'] == 'favorites' || cp.param['timeline_type'] == 'perma' );

			// タイマー起動
			if ( ( g_cmn.account[cp.param['account_id']].notsave.stream != 2 && !tl_noreload ) ||
				 ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 && !tl_stream && !tl_noreload ) )
			{
				tm = setInterval( function() {
					ListMake( cp.param['get_count'], 'new' );
				}, cp.param['reload_time'] * 1000 );
			}

			// stream表示
			if ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 &&
				( cp.param['timeline_type'] == 'home' ||
				  cp.param['timeline_type'] == 'mention' ||
				  cp.param['timeline_type'] == 'dmrecv' ||
				  cp.param['timeline_type'] == 'dmsent' ) )
			{
				lines.find( '.streamuse' ).css( { display: 'inline-block' } );
			}
			else
			{
				lines.find( '.streamuse' ).css( { display: 'none' } );
			}
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.timeline_reload' ).click( function() {
			lines.find( '.panel_btns' ).find( '.streamuse' ).removeClass( 'reconnect tooltip' ).attr( 'tooltip', '' );

			timeline_list.trigger( 'reload_timer' );
			ListMake( cp.param['get_count'], 'reload' );
		} );

		////////////////////////////////////////
		// クリアボタンクリック
		////////////////////////////////////////
		lines.find( '.panel_btns' ).find( '.timeline_clear' ).click( function() {
			lines.find( '.panel_btns' ).find( '.streamuse' ).removeClass( 'reconnect tooltip' ).attr( 'tooltip', '' );

			status_ids = {};
			timeline_list.html( '' );
			timeline_list.scrollTop( 0 );

			badge.hide().html( '' );
			$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( '' );
		} );

		////////////////////////////////////////
		// 一番上へ
		////////////////////////////////////////
		lines.find( '.sctbl' ).find( 'a:first' ).click( function( e ) {
			timeline_list.scrollTop( 0 );
		} );

		////////////////////////////////////////
		// 一番下へ
		////////////////////////////////////////
		lines.find( '.sctbl' ).find( 'a:last' ).click( function( e ) {
			timeline_list.scrollTop( timeline_list.prop( 'scrollHeight' ) );
		} );

		////////////////////////////////////////
		// 引用
		////////////////////////////////////////
		var QuoteText = function( item ) {
			var url = item.find( 'span.date > a' ).attr( 'href' );

			var pid = IsUnique( 'tweetbox' );

			var SetText = function() {
				$( '#tweetbox_text' ).val( $( '#tweetbox_text' ).val() + ' ' + url )
					.focus()
					.trigger( 'keyup' )
					.SetPos( 'end' );
			};

			// ツイートパネルが開いていない場合は開く
			if ( pid == null )
			{
				var _cp = new CPanel( null, null, 324, 240 );
				_cp.SetType( 'tweetbox' );
				_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0083' ), false );
				_cp.SetParam( { account_id: cp.param['account_id'], maxlen: 140, } );
				_cp.Start( function() {
					SetText();
				} );
			}
			else
			{
				SetText();

				var _cp = GetPanel( pid );
				_cp.param.account_id = cp.param['account_id'];
				$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );
			}
		}

		////////////////////////////////////////
		// DMを書く
		////////////////////////////////////////
		var DMWrite = function( item ) {
			var screen_name = item.attr( 'screen_name' );

			// パネルのパラメータ
			var param = {
				account_id: cp.param['account_id'],
				screen_name: screen_name,
				maxlen: g_cmn.twconfig['dm_text_character_limit'],
/*				maxlen: 140,*/
			};

			var pid = IsUnique( 'dmbox' );
			var left = null;
			var top = null;
			var width = 324;

			// DMパネルが開いている場合は閉じる
			if ( pid != null )
			{
				// 位置とサイズを保存
				$( '#' + pid ).each( function() {
					left = $( this ).position().left;
					top = $( this ).position().top;
					width = $( this ).width();
				} );

				$( '#' + pid ).find( '.close' ).trigger( 'click', [false] );
			}

			var _cp = new CPanel( left, top, width, 200 );
			_cp.SetType( 'dmbox' );
			_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0149', [screen_name] ), false );
			_cp.SetParam( param );
			_cp.Start();
		};

		////////////////////////////////////////
		// リツイート
		////////////////////////////////////////
		var Retweet = function( item, account_id ) {
			if ( g_cmn.cmn_param['confirm_rt'] == 0 || confirm( chrome.i18n.getMessage( 'i18n_0175' ) ) )
			{
				var param = {
					type: 'POST',
					url: ApiUrl( '1.1' ) + 'statuses/retweet/' + item.attr( 'status_id' ) + '.json',
					data: {},
				};

				Blackout( true, false );
				$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

				SendRequest(
					{
						action: 'oauth_send',
						acsToken: g_cmn.account[account_id]['accessToken'],
						acsSecret: g_cmn.account[account_id]['accessSecret'],
						param: param,
						id: account_id
					},
					function( res )
					{
						if ( res.status == 200 )
						{
							// リツイート表示を埋め込む
							if ( item.find( '.retweet' ).length == 0 )
							{
								item.find( '.icon' ).append( "<div class='retweet tooltip' tooltip='" +
										chrome.i18n.getMessage( 'i18n_0013', [g_cmn.account[account_id]['screen_name']] ) +
										"' rt_user_id='" + g_cmn.account[account_id]['user_id'] + "' rt_screen_name='" + g_cmn.account[account_id]['screen_name'] + "'>" +
										"<img src='" + g_cmn.account[account_id]['icon'] + "' class='rt_icon'></div>" )
									.css( { width: g_cmn.cmn_param['iconsize'] } )
									.find( '> img' ).css( { width: g_cmn.cmn_param['iconsize'], height: g_cmn.cmn_param['iconsize'] } )
									.end()
									.find( '.retweet img' ).css( { width: g_cmn.cmn_param['iconsize'] * 0.7, height: g_cmn.cmn_param['iconsize'] * 0.7 } );

								// ユーザーごとのアイコンサイズ適用
								SetUserIconSize( item );
							}

							// ツイート数表示の更新
							StatusesCountUpdate( account_id, 1 );
						}
						else
						{
							ApiError( chrome.i18n.getMessage( 'i18n_0177' ), res );
						}

						Blackout( false, false );
						$( '#blackout' ).activity( false );
					}
				);
			}
		};

		////////////////////////////////////////
		// クリックイベント
		////////////////////////////////////////
		timeline_list.click( function( e ) {
			var targ = $( e.target );
			var ptarg = targ.parent();

			////////////////////////////////////////
			// ユーザ名クリック
			////////////////////////////////////////
			if ( targ.hasClass( 'name' ) )
			{
				OpenUserTimeline( targ.parent().find( '.screen_name' ).text(), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// スクリーン名クリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'screen_name' ) )
			{
				OpenUserTimeline( targ.parent().find( '.screen_name' ).text(), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// アイコンクリック
			////////////////////////////////////////
			else if ( ptarg.hasClass( 'icon' ) )
			{
				var user_id = ptarg.parent().attr( 'user_id' );

				OpenUserShow( ptarg.parent().attr( 'screen_name' ),
					user_id,
					cp.param['account_id'] );
			}
			////////////////////////////////////////
			// RTユーザアイコンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'rt_icon' ) )
			{
				OpenUserShow( targ.parent().attr( 'rt_screen_name' ), targ.parent().attr( 'rt_user_id' ), cp.param['account_id'] );
			}
			////////////////////////////////////////
			// リンククリック処理
			////////////////////////////////////////
			else if ( ptarg.hasClass( 'tweet_text' ) )
			{
				if ( targ.hasClass( 'anchor' ) )
				{
					if ( targ.hasClass( 'url' ) )
					{
						var url = targ.attr( 'href' );

						// ツイートへのパーマリンク
						if ( url.match( /^https?:\/\/(mobile\.)*twitter\.com\/(#!\/)?(\w+)\/status(es)?\/(\d+)(\?.+)?$/ ) )
						{
							var screen_name = RegExp.$3;
							var status_id = RegExp.$5;

							var _cp = new CPanel( null, null, 360, 240 );
							_cp.SetType( 'timeline' );
							_cp.SetParam( {
								account_id: cp.param['account_id'],
								timeline_type: 'perma',
								screen_name: screen_name,
								status_id: status_id,
								reload_time: g_cmn.cmn_param['reload_time'],
							} );
							_cp.Start();

							return false;
						}

						window.open( url, '_blank' );
						return false;
					}

					if ( targ.hasClass( 'user' ) )
					{
						OpenUserTimeline( targ.text().replace( /^@/, '' ), cp.param['account_id'] );
					}

					if ( targ.hasClass( 'hashtag' ) )
					{
						OpenSearchResult( targ.text(), cp.param['account_id'] );
					}
				}
			}
			////////////////////////////////////////
			// 返信ボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_reply' ) )
			{
				var item = targ.parent().parent().parent().parent();

				// DMの返信
				if ( cp.param['timeline_type'] == 'dmrecv' )
				{
					DMWrite( item );

					e.stopPropagation();
					return;
				}

				// 返信ツイート情報
				var reply = {
					status_id: ( item.attr( 'rt_id' ) ) ? item.attr( 'rt_id' ) : item.attr( 'status_id' ),
					icon: item.find( '.icon' ).find( 'img' ).attr( 'src' ),
					screen_name: item.attr( 'screen_name' ),
					date: item.find( '.date' ).text(),
					status: escapeHTML( item.find( '.tweet' ).find( '.tweet_text' ).text() ),
				};

				// 返信ツイート＆宛先設定処理
				var SetParameters = function() {
					$( '#' + pid ).find( 'div.contents' ).trigger( 'repset', [reply] );

					GetPanel( pid ).param.account_id = cp.param['account_id'];
					$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );

					// 本文中のユーザーを宛先に設定する
					ExtractReplyUser( item );

					SetFront( $( '#' + pid ) );
				}

				var pid = IsUnique( 'tweetbox' );

				if ( pid == null )
				{
					// パネルのパラメータ
					var param = {
						account_id: cp.param['account_id'],
						maxlen: 140,
					};

					var _cp = new CPanel( null, null, 324, 240 );
					_cp.SetType( 'tweetbox' );
					_cp.SetTitle( chrome.i18n.getMessage( 'i18n_0083' ), false );
					_cp.SetParam( param );
					_cp.Start( function() {
						pid = IsUnique( 'tweetbox' );
						SetParameters();
					} );
				}
				else
				{
					SetParameters();
				}
			}
			////////////////////////////////////////
			// メニューボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_menu' ) )
			{
				// disabledなら処理しない
				if ( targ.hasClass( 'disabled' ) )
				{
					return;
				}

				var item = targ.parent().parent().parent().parent();

				// 最初にクリックされたときにメニューボックス部を作成
				if ( item.find( '.menubox' ).length == 0 )
				{
					item.find( '.tweet' ).append( OutputTPL( 'timeline_menu', {
						protected: item.attr( 'protected' ),
						toolbaruser: ( IsToolbarUser( item.attr( 'user_id' ) ) != -1 ) ? true : false,
					} ) );

					var menubox = item.find( 'div.tweet' ).find( 'div.menubox' );

					// 翻訳ボタンクリック処理
					menubox.find( '> a.trans' ).on( 'click', function( e ) {
						var text = item.find( '.tweet' ).find( '.tweet_text' );
						var notrans = $( this ).parent().find( '.notrans' );

						// 原文を保存
						if ( notrans.attr( 'srctext' ) == '' )
						{
							notrans.attr( 'srctext', text.html() )
								.removeClass( 'disabled' );
						}

						// 翻訳処理(bing)
						SendRequest(
							{
								action: 'translate',
								src: $( this ).attr( 'from' ),
								targ: $( this ).attr( 'to' ),
								word: text.text(),
							},
							function( res )
							{
								if ( res != '' )
								{
									var restext = res;
									restext = restext.replace( /@ ([0-9a-zA-Z_]+)/g, '@$1' );
									restext = restext.replace( /# ([0-9a-zA-Z_]+)/g, '#$1' );

									restext = escapeHTML( restext );

									restext = Txt2Link( restext );

									text.html( restext );
								}
							}
						);

						e.stopPropagation();
					} );

					// 元に戻すボタンクリック処理
					menubox.find( '> a.notrans' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var text = item.find( '.tweet' ).find( '.tweet_text' );

						text.html( $( this ).attr( 'srctext' ) );

						$( this ).attr( 'srctext', '' ).addClass( 'disabled' );

						e.stopPropagation();
					} );

					// DMを書くボタンクリック処理
					menubox.find( '> a.dmsend' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						DMWrite( $( this ).parent().parent().parent() );

						e.stopPropagation();
					} );

					// 引用するボタンクリック処理
					menubox.find( '> a.quote' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						QuoteText( $( this ).parent().parent().parent() );

						e.stopPropagation();
					} );

					// @検索ボタンクリック処理
					menubox.find( '> a.usersearch' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var screen_name = item.attr( 'screen_name' );

						OpenSearchResult( '@' + screen_name, cp.param['account_id'] );
						e.stopPropagation();
					} );

					// ツールバーに登録ボタンクリック処理
					menubox.find( '> a.toolbaruser' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						// ツールバーから削除
						if ( $( this ).attr( 'toolbaruser' ) == 'true' )
						{
							var len = g_cmn.toolbar_user.length;

							for ( var i = 0 ; i < len ; i++ )
							{
								if ( g_cmn.toolbar_user[i].screen_name == item.attr( 'screen_name' ) && g_cmn.toolbar_user[i].type == 'user' )
								{
									g_cmn.toolbar_user.splice( i, 1 );
									break;
								}
							}

							$( this ).attr( 'toolbaruser', false ).html( chrome.i18n.getMessage( 'i18n_0092' )  );

							UpdateToolbarUser();
						}
						// ツールバーに登録
						else
						{
							if ( IsToolbarUser( item.attr( 'user_id' ) ) == -1 )
							{
								g_cmn.toolbar_user.push( {
									type: 'user',
									user_id: item.attr( 'user_id' ),
									screen_name: item.attr( 'screen_name' ),
									icon: item.find( '.icon img' ).attr( 'src' ),
									account_id: cp.param['account_id'],
									created_at: item.attr( 'created_at' ),
								} );
							}

							$( this ).attr( 'toolbaruser', true ).html( chrome.i18n.getMessage( 'i18n_0091' ) );

							UpdateToolbarUser();
						}

						e.stopPropagation();
					} );

					// リストに追加ボタンクリック処理
					menubox.find( '> a.addlist' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var account = g_cmn.account[cp.param['account_id']];

						item.find( '.listmenu' ).toggle()
							.css( {
								left: 0,
								top: menubox.height() + 2,
								width: menubox.width(),
							} )
							.find( '.list' ).css( {
								height: item.find( '.listmenu' ).height() - item.find( '.listmenu .head' ).height()
							} );

						// リスト一覧出力
						var PutLists = function() {
							var s = '';

							for ( var i = 0, _len = account.lists.length ; i < _len ; i++ )
							{
								s += OutputTPL( 'listmenu_list', { item: account.lists[i] } );
							}

							menubox.find( '.listmenu .list' ).html( s );

							menubox.find( '.listmenu .head a' ).off('click').on( 'click', function() {
								GetLists();
							} );

							// リスト名クリック処理
							menubox.find( '.listmenu .list span[class!=icon-lock]' ).click( function( e ) {
								var slug = $( this ).parent().attr( 'slug' );
								var name = $( this ).parent().attr( 'name' );
								var list_id = $( this ).parent().attr( 'id_str' );
								var user_id = item.attr( 'user_id' );

								var param = {
									type: 'POST',
									url: ApiUrl( '1.1' ) + 'lists/members/create.json',
									data: {
										list_id: list_id,
										user_id: user_id,
									},
								};

								Blackout( true );
								$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

								SendRequest(
									{
										action: 'oauth_send',
										acsToken: account.accessToken,
										acsSecret: account.accessSecret,
										param: param,
										id: cp.param['account_id']
									},
									function( res )
									{
										if ( res.status == 200 )
										{
											MessageBox( chrome.i18n.getMessage( 'i18n_0182', [item.attr( 'screen_name' ),name] ) );
										}
										else
										{
											ApiError( chrome.i18n.getMessage( 'i18n_0183', [item.attr( 'screen_name' ),name] ), res );
										}

										Blackout( false );
										$( '#blackout' ).activity( false );
									}
								);

								e.stopPropagation();
							} );
						};

						// リスト一覧取得
						var GetLists = function() {
							var param = {
								type: 'GET',
								url: ApiUrl( '1.1' ) + 'lists/list.json',
								data: {
									screen_name: account.screen_name,
								},
							};

							menubox.find( '.listmenu .list' ).activity( { color: '#ffffff' } );

							SendRequest(
								{
									action: 'oauth_send',
									acsToken: account.accessToken,
									acsSecret: account.accessSecret,
									param: param,
									id: cp.param['account_id']
								},
								function( res )
								{
									account.lists = new Array();

									if ( res.status == 200 )
									{
										for ( var i = 0, _len = res.json.length ; i < _len ; i++ )
										{
											account.lists.push( {
												id_str: res.json[i].id_str,
												slug: res.json[i].slug,
												name: res.json[i].name,
												mode: res.json[i].mode,
											} );
										}
									}
									else
									{
										ApiError( chrome.i18n.getMessage( 'i18n_0169' ), res );
									}

									PutLists();

									$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
									menubox.find( '.listmenu .list' ).activity( false );
								}
							);
						};

						// リストを一度も読み込んでいない場合は、最新のリスト一覧を取得する。
						if ( account.lists == null )
						{
							GetLists();
						}
						else
						{
							PutLists();
						}

						e.stopPropagation();
					} );

					// アイコンサイズボタンクリック処理
					menubox.find( '> a.iconsize' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var user_id = item.attr( 'user_id' );

						item.find( '.iconsizemenu' ).toggle()
							.css( {
								left: 0,
								top: menubox.height() + 2,
							} );

						if ( item.find( '.iconsizemenu' ).find( '.slidercontainer' ).length == 0 )
						{
							var iconsize = ( g_cmn.user_iconsize[user_id] ) ? g_cmn.user_iconsize[user_id] : g_cmn.cmn_param['iconsize'];

							item.find( '.iconsizemenu' ).html( OutputTPL( 'iconsizemenu', { iconsize: iconsize } ) );

							item.find( '.iconsizemenu' ).find( '.slidercontainer' ).find( '.set_iconsize' ).slider( {
								min: 8,
								max: 64,
								step: 2,
								value: iconsize,
								animate: 'fast',
								slide: function( e, ui ) {
									item.find( '.iconsizemenu' ).find( '.slidercontainer' ).find( '.value_disp' ).html( ui.value + 'px' );
								},
								change: function( e, ui ) {
									g_cmn.user_iconsize[user_id] = ui.value;

									SetUserIconSize( $( 'div.contents.timeline' ).find( 'div.item[user_id=' + user_id + ']' ) );
								}
							} );
						}

						e.stopPropagation();
					} );

					// NGに追加ボタンクリック処理
					menubox.find( '> a.addfilter' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var screen_name = item.attr( 'screen_name' );

//						if ( g_cmn.cmn_param.ngwords.length >= 100 )
//						{
//							MessageBox( chrome.i18n.getMessage( 'i18n_0069' ) );
//						}
//						else
						{
							var check = false;

							for ( var i = 0, _len = g_cmn.cmn_param.ngwords.length ; i < _len ; i++ )
							{
								if ( g_cmn.cmn_param.ngwords[i].type == 'user' &&
									 g_cmn.cmn_param.ngwords[i].word == screen_name )
								{
									check = true;
									break;
								}
							}

							if ( check == false )
							{
								g_cmn.cmn_param.ngwords.push( {
									enabled: 'true',
									type: 'user',
									word: screen_name,
								} );

								MakeNGRegExp();
								$( this ).addClass( 'disabled' );
							}
						}

						e.stopPropagation();
					} );

					// 個別表示ボタンクリック処理
					menubox.find( '> a.individual' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var screen_name = item.attr( 'screen_name' );
						var status_id = item.attr( 'status_id' );

						var _cp = new CPanel( null, null, 360, 240 );
						_cp.SetType( 'timeline' );
						_cp.SetParam( {
							account_id: cp.param['account_id'],
							timeline_type: 'perma',
							screen_name: screen_name,
							status_id: status_id,
							reload_time: g_cmn.cmn_param['reload_time'],
						} );
						_cp.Start();

						e.stopPropagation();
					} );

					// Speechボタンクリック処理(TEST)
					menubox.find( '> a.speech' ).on( 'click', function( e ) {
						// disabledなら処理しない
						if ( $( this ).hasClass( 'disabled' ) )
						{
							return;
						}

						var text = item.find( '.tweet' ).find( '.tweet_text' ).text();
						var uttr = new SpeechSynthesisUtterance( text );
						uttr.lang = 'ja-JP';

						speechSynthesis.speak( uttr );

						e.stopPropagation();
					} );
				}

				item.find( '.menubox' ).toggle();
				item.find( '.listmenu' ).hide();
				item.find( '.iconsizemenu' ).hide();
			}
			////////////////////////////////////////
			// RTボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_retweet' ) )
			{
				// disabledなら処理しない
				if ( targ.hasClass( 'disabled' ) )
				{
					return;
				}

				var item = targ.parent().parent().parent().parent();

				// Ctrl+RTボタンで引用
				if ( e.ctrlKey )
				{
					QuoteText( item );
				}
				else
				{
					if ( AccountCount() > 1 && g_cmn.cmn_param['rt_accsel'] == 1 )
					{
						var s = '';
						var accsel = item.find( '.accsel' );

						accsel.html( '' );

						var account_id;

						for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
						{
							account_id = g_cmn.account_order[i];
							accsel.append( OutputTPL( 'timeline_accsel', { item: g_cmn.account[account_id], account_id: account_id } ) );
						}

						accsel.find( 'img' ).click( function( e ) {
							Retweet( item, $( this ).attr( 'account_id' ) );
							$( this ).parent().toggle();
						} );

						accsel.toggle();
						return;
					}
					else
					{
						Retweet( item, cp.param['account_id'] );
					}
				}
			}
			////////////////////////////////////////
			// 削除ボタンクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'timeline_del' ) )
			{
				var item = targ.parent().parent().parent().parent();

				if ( confirm( chrome.i18n.getMessage( 'i18n_0224' ) ) )
				{
					// DM以外
					if ( cp.param['timeline_type'] != 'dmrecv' && cp.param['timeline_type'] != 'dmsent' )
					{
						var param = {
							type: 'POST',
							url: ApiUrl( '1.1' ) + 'statuses/destroy/' + item.attr( 'status_id' ) + '.json',
							data: {},
						};
					}
					// DM
					else
					{
						var param = {
							type: 'POST',
							url: ApiUrl( '1.1' ) + 'direct_messages/destroy.json',
							data: {
								id: item.attr( 'status_id' )
							},
						};
					}

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
								// タイムラインから削除
								item.fadeOut( 'fast', function() {
									// 返信元の表示を消す
									while ( 1 )
									{
										var next = item.next();

										if ( next.hasClass( 'res' ) )
										{
											next.remove();
										}
										else
										{
											break;
										}
									}

									delete status_ids[$( this ).attr( 'status_id' )];
									$( this ).remove();

									if ( cp.param['timeline_type'] != 'dmrecv' && cp.param['timeline_type'] != 'dmsent' )
									{
										// ツイート数表示の更新
										StatusesCountUpdate( cp.param['account_id'], 1 );
									}
								} );
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0225' ), res );
							}

							Blackout( false );
							$( '#blackout' ).activity( false );
						}
					);
				}
			}
			////////////////////////////////////////
			// ☆クリック処理
			////////////////////////////////////////
			else if ( targ.hasClass( 'fav' ) )
			{
				var item = targ.parent().parent().parent().parent();

				// on→off
				if ( targ.hasClass( 'on' ) )
				{
					var param = {
						type: 'POST',
						url: ApiUrl( '1.1' ) + 'favorites/destroy.json',
						data: {
							id: item.attr( 'status_id' )
						},
					};

					Blackout( true, false );
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
								targ.removeClass( 'on' ).addClass( 'off' );
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0225' ), res );
							}

							Blackout( false, false );
							$( '#blackout' ).activity( false );
						}
					);
				}
				// off→on
				else
				{
					// animate
					var _heart = targ.clone();

					$( '#main' ).append( _heart );

					targ.css( {
						visibility: 'hidden',
					} );

					_heart.css( {
						position: 'absolute',
						left: targ.offset().left,
						top: targ.offset().top,
						zIndex: targ.zIndex() + 1,
						fontSize: '1.3rem',
						color: '#a4a396'
					} );

					var _mag = 4;

					_heart.animate(
						{
							fontSize: targ.outerWidth() * _mag + 'px',
							left: targ.offset().left - targ.outerWidth() * ( _mag - 1 ) / 2 + 'px',
							top: targ.offset().top - targ.outerHeight() * ( _mag - 1 ) / 2 + 'px',
							opacity: 0.2,
							color: '#dd2e44'
						},
						300,
						function() {
							targ.css( {
								visibility: 'visible'
							} )

							_heart.remove();
						}
					);

					var param = {
						type: 'POST',
						url: ApiUrl( '1.1' ) + 'favorites/create.json',
						data: {
							id: item.attr( 'status_id' )
						},
					};

					Blackout( true, false );
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
								targ.removeClass( 'off' ).addClass( 'on' );
							}
							else
							{
								ApiError( chrome.i18n.getMessage( 'i18n_0057' ), res );
							}

							Blackout( false, false );
							$( '#blackout' ).activity( false );
						}
					);
				}
			}
			////////////////////////////////////////
			// しおりクリック
			////////////////////////////////////////
			else if ( targ.hasClass( 'bookmark' ) )
			{
				var item = targ.parent().parent();

				if ( targ.hasClass( 'nomark' ) )
				{
					if ( cp.param['bookmark'][0] )
					{
						timeline_list.find( 'div.item[status_id=' + cp.param['bookmark'][0] + ']' ).find( '.bookmark' ).removeClass( 'mark1' ).addClass( 'nomark' );
					}

					targ.removeClass( 'nomark' ).addClass( 'mark1' );
					cp.param['bookmark'][0] = item.attr( 'status_id' );
				}
				else
				{
					targ.removeClass( 'mark1' ).addClass( 'nomark' );
					cp.param['bookmark'][0] = '';
				}
			}
			////////////////////////////////////////
			// パクツイ
			////////////////////////////////////////
			else if ( targ.hasClass( 'tweet_text' ) && e.altKey == true && g_devmode )
			{
				var data = {};

				data['status'] = targ.text();

				var param = {
					type: 'POST',
					url: ApiUrl( '1.1' ) + 'statuses/update.json',
					data: data,
				};

				Blackout( true, false );

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
							// ツイート数表示の更新
							StatusesCountUpdate( cp.param['account_id'], 1 );
						}
						else
						{
							console.log( 'status[' + res.status + ']' );
							ApiError( chrome.i18n.getMessage( 'i18n_0087' ), res );
						}

						Blackout( false, false );
					}
				);
			}
			else
			{
				return;
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// RTアイコン右クリック
		////////////////////////////////////////
		timeline_list.on( 'contextmenu', $( '> div.item' ).find( 'div.icon' ).find( 'img.rt_icon' ).selector, function( e ) {
			OpenUserTimeline( $( this ).parent().attr( 'rt_screen_name' ), cp.param['account_id'] );

			return false;
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', $( '> div.item' ).find( 'div.icon' ).find( '> img' ).selector, function( e ) {
			if ( e.type == 'mouseenter' )
			{
				// Draggableの設定をする
				if ( !$( this ).hasClass( 'ui-draggable' ) )
				{
					SetDraggable( $( this ), p, cp );
				}
			}
			else
			{
				$( '#tooltip' ).hide();
			}
		} );

		////////////////////////////////////////
		// リンクにカーソルを乗せたとき
		////////////////////////////////////////
		var onURL = false;

		timeline_list.on( 'mouseenter mouseleave', $( '> div.item' ).find( 'div.tweet_text' ).find( 'a.anchor.url' ).selector, function( e, noloading, stream ) {
			var anchor = $( this );
			var item = anchor.parent().parent().parent();
			var url = anchor.attr( 'href' );

			if ( e.type == 'mouseenter' )
			{
				onURL = true;

				setTimeout( function() {
					if ( onURL == false )
					{
						return;
					}

					// 短縮URLの場合、URL展開を行う
					if ( isShortURL( url ) && g_cmn.cmn_param['urlexpand'] == 1 )
					{
						anchor.removeClass( 'anchor' )
							.addClass( 'expand' )
							.removeAttr( 'href' );

						if ( !noloading )
						{
							item.find( '.tweet' ).activity( { color: '#ffffff' } );
						}

						var org = url;

						// URL展開
						SendRequest(
							{
								action: 'url_expand',
								url: url,
							},
							function( res )
							{
								var durl;

								try {
									durl = escapeHTML( decodeURI( res ) );
								}
								catch ( e )
								{
									console.log( 'decode error [' + res + ']' );
									durl = res;
								}

								if ( res != '' )
								{
									anchor.attr( 'href', res );
									anchor.html( res );
								}
								else
								{
									anchor.attr( 'href', org );
									anchor.html( org );
								}

								anchor.removeClass( 'expand' )
									.addClass( 'anchor' );

								if ( !noloading )
								{
									item.find( '.tweet' ).activity( false );
								}
							}
						);
					}
					else if ( g_cmn.cmn_param['thumbnail'] )
					{
						var add = item.find( '.additional' );
						var id;

						if ( add.length == 0 )
						{
							item.find( '.tweet' ).append( "<div class='bottomcontainer'><div class='additional'></div></div>" );
							add = item.find( '.additional' );
						}

						////////////////////////////////////////
						// サムネイル表示＆
						// 原寸サイズ表示処理作成
						////////////////////////////////////////
						var MakeImgLink = function( thumb, original, mov, img_count, isvideo, contenttype ) {
							if ( add.find( 'img[loaded="' + url + '"]' ).length < img_count )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								add.append( OutputTPL( ( mov ) ? 'thumbnail_movie' : 'thumbnail', {
									url: thumb,
									tooltip: url
								} ) );

								// ロード失敗
								add.find( 'img:last-child' ).error( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}
									$( this ).remove();
								} );

								// ロード成功
								add.find( 'img:last-child' ).load( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}

									if ( original != '' )
									{
										if ( mov )
										{
											$( this ).addClass( 'link' );

											$( this ).click( function( e ) {
												chrome.tabs.create( { url: original }, function( tab ) {
												} );

												e.stopPropagation();
											} );
										}
										else
										{
											$( this ).addClass( 'link' );

											$( this ).click( function( e ) {
												var _cp = new CPanel( null, null, 320, 320 );
												_cp.SetType( 'image' );
												_cp.SetParam( {
													url: original,
													video: isvideo,
													contenttype: contenttype,
												} );
												_cp.Start();

												e.stopPropagation();
											} );
										}
									}
									else
									{
										$( this ).removeClass( 'tooltip' );
									}
								} );
							}
						};

						// twitpic
						if ( url.match( /^http:\/\/twitpic\.com\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://twitpic.com/show/mini/' + id,
										 'http://twitpic.com/show/full/' + id,
										 false, 1 );
						}
						// ow.ly/i
						else if ( url.match( /^http:\/\/ow\.ly\/i\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://static.ow.ly/photos/thumb/' + id + '.jpg',
										 'http://static.ow.ly/photos/original/' + id + '.jpg',
										 false, 1 );
						}
						// yfrog
						else if ( url.match( /^http:\/\/yfrog\.com\/(\w+)/ ) )
						{
							id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'yfrog_url',
										imgid: id,
									},
									function( res )
									{
										MakeImgLink( 'http://yfrog.com/' + id + ':small', res, false, 1 );

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// tweetphoto/plixi
						else if ( url.match( /^(http:\/\/tweetphoto\.com\/\d+)/ ) ||
								  url.match( /^(http:\/\/plixi\.com\/p\/\d+)/ ) ||
								  url.match( /^(http:\/\/lockerz\.com\/s\/\d+)/ ) )
						{
							var purl = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'plixi_url',
										imgurl: purl,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// twipple
						else if ( url.match( /http:\/\/p\.twipple\.jp\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://p.twipple.jp/show/thumb/' + id,
										 'http://p.twipple.jp/show/orig/' + id, false, 1 );
						}
						// movapic
						else if ( url.match( /http:\/\/movapic\.com\/pic\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://image.movapic.com/pic/t_' + id + '.jpeg',
										 'http://image.movapic.com/pic/m_' + id + '.jpeg', false, 1 );
						}
						// フォト蔵
						else if ( url.match( /http:\/\/photozou\.jp\/photo\/show\/\d+\/(\d+)/ ) )
						{
							id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'photozou_url',
										imgid: id,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// instagram
						else if ( url.match( /https?:\/\/((www\.)?instagram\.com|instagram\.com|instagr\.am)\/p\/([\w\-]+)/ ) )
						{
							id = RegExp.$3;

							MakeImgLink( 'http://instagram.com/p/' + id + '/media/?size=t',
										 'http://instagram.com/p/' + id + '/media/?size=l',
										 false, 1 );
						}
						// 公式
						else if ( url.match( /https?:\/\/twitter\.com.*\/(photo|video)\/1$/ ) )
						{
							if ( anchor.attr( 'mediaurl' ) )
							{
								var mediaurls = anchor.attr( 'mediaurl' ).split( ',' );
								var videourls = anchor.attr( 'videourl' ).split( ',' );
								var contenttypes = anchor.attr( 'contenttype' ).split( ',' );

								for ( var i = 0, _len = mediaurls.length ; i < _len ; i++ )
								{
									if ( videourls[i] == '' )
									{
										MakeImgLink( mediaurls[i] + ':thumb',
													 mediaurls[i] + ':orig', false, mediaurls.length );
									}
									else
									{
										MakeImgLink( mediaurls[i],
													 videourls[i], false, mediaurls.length, true, contenttypes[i] );
									}
								}
							}
						}
						// 公式(DM)
						else if ( url.match( /https?:\/\/twitter\.com.*\/messages\/media\/\d+$/ ) )
						{
							if ( anchor.attr( 'mediaurl' ) )
							{
								var mediaurls = anchor.attr( 'mediaurl' ).split( ',' );

								for ( var i = 0, _len = mediaurls.length ; i < _len ; i++ )
								{
									MakeImgLink( mediaurls[i] + ':thumb',
												 mediaurls[i], false, mediaurls.length );
								}
							}
						}
						// youtube
						else if ( url.match( /^https?:\/\/(?:(?:www|m)\.youtube\.com\/watch\?.*v=|youtu\.be\/)([\w-]+)/ ) )
						{
							var id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								add.append( OutputTPL( 'thumbnail_movie', {
									url: 'http://i.ytimg.com/vi/' + id + '/default.jpg',
									tooltip: url
								} ) );

								// ロード失敗
								add.find( 'img:last-child' ).error( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}
									$( this ).remove();
								} );

								// ロード成功
								add.find( 'img:last-child' ).load( function( e ) {
									if ( !noloading )
									{
										item.find( '.tweet' ).activity( false );
									}

									$( this ).addClass( 'link' );

									$( this ).click( function( e ) {
										var _cp = new CPanel( null, null, 480, 360 );
										_cp.SetType( 'youtube' );
										_cp.SetParam( {
											url: url,
										} );
										_cp.Start();

										e.stopPropagation();
									} );
								} );
							}
						}
						// Vine
						else if ( url.match( /^https?:\/\/vine\.co\/v\/(\w+)/ ) )
						{
							var id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'vine_url',
										imgurl: url,
									},
									function( res )
									{
										if ( res != '' )
										{
											add.append( OutputTPL( 'thumbnail_movie', {
												url: res.thumb,
												tooltip: url
											} ) );
										}

										// ロード失敗
										add.find( 'img:last-child' ).error( function( e ) {
											if ( !noloading )
											{
												item.find( '.tweet' ).activity( false );
											}
											$( this ).remove();
										} );

										// ロード成功
										add.find( 'img:last-child' ).load( function( e ) {
											if ( !noloading )
											{
												item.find( '.tweet' ).activity( false );
											}

											$( this ).addClass( 'link' );

											$( this ).click( function( e ) {
												var _cp = new CPanel( null, null, 480, 510 );
												_cp.SetType( 'vine' );
												_cp.SetParam( {
													url: url,
													screen_name: item.attr( 'screen_name' ),
												} );
												_cp.Start();

												e.stopPropagation();
											} );
										} );
									}
								);
							}
						}
						// TINAMI
						else if ( url.match( /http:\/\/tinami\.jp\/(\w+)$/ ) )
						{
							id = RegExp.$1;

							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'tinami_url',
										imgid: id,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// ニコニコ動画
						else if ( url.match( /http:\/\/(www\.nicovideo\.jp\/watch|nico\.ms)\/sm(\d+)(\?.+)?$/ ) )
						{
							id = RegExp.$2;

							MakeImgLink( 'http://tn-skr' + ( parseInt( id ) % 4 + 1 ) + '.smilevideo.jp/smile?i=' + id, '', true, 1 );
						}
						// img.ly
						else if ( url.match( /^http:\/\/img\.ly\/(\w+)/ ) )
						{
							id = RegExp.$1;

							MakeImgLink( 'http://img.ly/show/thumb/' + id,
										 'http://img.ly/show/full/' + id,
										 false, 1 );
						}
						// Streamスクリーンショット
						else if ( url.match( /(http:\/\/cloud(-\d)?\.steampowered\.com\/ugc\/\d+\/\w+\/)(\d+x\d+\.resizedimage)?$/ ) )
						{
							MakeImgLink( RegExp.$1 + '150x150.resizedimage', url, false, 1 );
						}
						// gyazo
						else if ( url.match( /https?:\/\/gyazo\.com\/\w+$/ ) )
						{
							if ( add.find( 'img[loaded="' + url + '"]' ).length == 0 )
							{
								if ( !noloading )
								{
									item.find( '.tweet' ).activity( { color: '#ffffff' } );
								}

								SendRequest(
									{
										action: 'gyazo_url',
										imgurl: url,
									},
									function( res )
									{
										if ( res != '' )
										{
											MakeImgLink( res.thumb, res.original, false, 1 );
										}

										if ( !noloading )
										{
											item.find( '.tweet' ).activity( false );
										}
									}
								);
							}
						}
						// 画像直リンク
						else if ( url.match( /https?:\/\/.*\.(png|jpg|jpeg|gif)$/i ) )
						{
							MakeImgLink( url, url, false, 1 );
						}
					}
				}, 100 );
			}
			else
			{
				onURL = false;
				$( '#tooltip' ).hide();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// カーソルを乗せたとき（ボタン群表示）
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', $( '> div.item' ).selector, function( e ) {
			var options = $( this ).find( 'div.options' );

			if ( e.type == 'mouseenter' )
			{
				timeline_list.find( '> div.items' ).find( 'div.options' ).find( 'span.btns' ).css( { display: 'none' } );

				// 初めて乗せたときに描画
				if ( options.find( 'span.btns' ).length == 0 )
				{
					options.prepend( OutputTPL( 'timeline_options', {
						mytweet: options.attr( 'mytweet' ),
						protected: options.attr( 'protected' ),
						type: cp.param['timeline_type'],
					} ) );
				}

				// ボタンにカーソルを乗せたときの処理
				options.find( 'span.btns, span.fav' ).on( 'mouseenter mouseleave', function( e ) {
					if ( e.type == 'mouseenter' )
					{
						cursor_on_option = true;
					}
					else
					{
						cursor_on_option = false;
					}

					e.stopPropagation();
				} )
				.css( { display: 'inline-block' } );
			}
			else
			{
				options.find( 'span.btns, span.fav.off' ).css( { display: 'none' } );
				$( '#tooltip' ).hide();
			}

			$( this ).find( 'div.accsel' ).hide();
		} );

		////////////////////////////////////////
		// スクロール抑止
		////////////////////////////////////////
		timeline_list.on( 'mouseenter mouseleave', $( '> div.item div.options span, > div.item div.bookmark' ).selector, function( e ) {
			if ( e.type == 'mouseenter' )
			{
				cursor_on_option = true;
			}
			else
			{
				cursor_on_option = false;
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 返信元クリック処理
		////////////////////////////////////////
		timeline_list.on( 'click', $( '> div.item' ).find( 'div.tweet' ).find( 'div.bottomcontainer' ).find( 'div.additional' ).find( 'div.in_reply_to' ).find( 'span.resicon' ).selector, function( e ) {
			OpenReplyTweet( $( this ), 5, 500, true );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 返信元を閉じる処理
		////////////////////////////////////////
		timeline_list.on( 'click', $( '> div.item' ).find( 'div.tweet' ).find( 'div.bottomcontainer' ).find( 'div.additional' ).find( 'div.in_reply_to_close' ).find( 'span.resicon' ).selector, function( e ) {
			var item = $( this ).parent().parent().parent().parent().parent();

			item.find( '.in_reply_to' ).show();
			item.find( '.in_reply_to_close' ).hide();

			item.nextAll().each( function() {
				if ( $( this ).hasClass( 'res' ) )
				{
					$( this ).remove();
				}
				else
				{
					return false;
				}
			} );

			item.removeClass( 'resopen' );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 位置情報クリック処理
		////////////////////////////////////////
		timeline_list.on( 'click', $( '> div.item' ).find( 'div.tweet' ).find( 'div.bottomcontainer' ).find( 'div.additional' ).find( 'div.geo' ).find( 'span' ).selector, function( e ) {
			var geo = $( this ).parent();
			var item = $( this ).parent().parent().parent().parent().parent();

			if ( geo.attr( 'geo' ).match( /(.*),(.*)/ ) )
			{
				var lat = RegExp.$1;
				var lng = RegExp.$2;

				var _cp = new CPanel( null, null, 480, 360 );
				_cp.SetType( 'googlemap' );
				_cp.SetParam( {
					lat: lat,
					lng: lng,
					zoom: 12,
				} );
				_cp.Start();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// もっと読むクリック処理
		////////////////////////////////////////
		timeline_list.on( 'click', $( '> div.readmore' ).selector, function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			$( this ).addClass( 'disabled' );

			ListMake( cp.param['get_count'], 'old' );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// スクロール処理
		////////////////////////////////////////
		timeline_list.scroll( function( e ) {
			// 最小化しているとき、設定画面を表示しているときは無視
			if ( cp.minimum.minimum == true )
			{
				return;
			}

			if ( setting_show )
			{
				return;
			}

			var _chgcnt = 0;
			var _tlh = timeline_list.height();
			var _tltop = timeline_list.position().top;

			newitems.each( function() {
				var item = $( this );

				var pos = item.position().top - _tltop;

				if ( pos < 0 )
				{
					return true;
				}

				if ( pos > _tlh )
				{
					return false;
				}

				item.removeClass( 'new' );

				if ( g_cmn.cmn_param['auto_thumb'] )
				{
					OpenThumbnail( item, ( g_cmn.account[cp.param['account_id']].notsave.stream == 2 &&
						( cp.param['timeline_type'] == 'home' || cp.param['timeline_type'] == 'mention' ) ) );
				}

				_chgcnt++;
			} );

			if ( _chgcnt )
			{
				newitems = $( timeline_list.find( 'div.item.new' ).get() );

				if ( newitems.length == 0 )
				{
					badge.hide().html( '' );
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( '' );
				}
				else
				{
					badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
				}
			}
		} );

		ListMake( cp.param['get_count'], 'init' );

		timeline_list.trigger( 'reload_timer' );

		// ホーム/Mention/DM/グループストリームの場合、ユーザーストリームの受け口を用意する
		if ( ( cp.param['timeline_type'] == 'home' ||
			   cp.param['timeline_type'] == 'mention' ||
			   cp.param['timeline_type'] == 'dmrecv' ||
			   cp.param['timeline_type'] == 'dmsent' ||
			   cp.param['timeline_type'] == 'group' ) )
		{
			////////////////////////////////////////
			// ストリームデータ受信処理
			////////////////////////////////////////
			cont.on( 'getstream', function( e, json ) {
				// APIの実行中はキューに保管
				if ( loading == true )
				{
					stream_queue.push( json );
					return;
				}

				var addcnt = 0;
				var tltype;

				if ( cp.param['timeline_type'] == 'dmrecv' )
				{
					tltype = 'dmrecv';
				}
				else if ( cp.param['timeline_type'] == 'dmsent' )
				{
					tltype = 'dmsent';
				}
				else
				{
					tltype = 'normal';
				}

				// グループストリームの場合はメンバーか確認
				var memchk = false;

				if ( cp.param['timeline_type'] == 'group' )
				{
					for ( var id in cp.param['users'] )
					{
						if ( id == json.user.id_str )
						{
							memchk = true;
							break;
						}
					}
				}

				// 引用元付きのときはキャッシュに追加
				AddQuoteCache( json );

				// 既に読み込み済みのツイート/非表示ユーザは無視
				if ( status_ids[json.id_str] == undefined )
				{
					var _sctop = timeline_list.scrollTop();

					if ( cp.param['timeline_type'] == 'home' || cp.param['timeline_type'] == 'mention' || ( cp.param['timeline_type'] == 'group' && memchk == true ) )
					{
						timeline_list.prepend( MakeTimeline( json, cp.param['account_id'] ) ).children( ':first' ).hide().fadeIn();
						//timeline_list.prepend( MakeTimeline( json, cp.param['account_id'] ) );

						// ハッシュタグプルダウンを更新
						if ( json.entities.hashtags.length )
						{
							$( 'div.contents' ).trigger( 'hashtag_pulldown_update' );
						}

						status_ids[json.id_str] = true;

						var users = {};

						users[json.id_str] = {
							icon: json.user.profile_image_url_https,
							screen_name: json.user.screen_name,
							created_at: json.created_at
						};

						UserInfoUpdate( users );
						addcnt++;
					}
					else if ( cp.param['timeline_type'] == 'dmrecv' || cp.param['timeline_type'] == 'dmsent' )
					{
						timeline_list.prepend( MakeTimeline_DM( json, cp.param['timeline_type'], cp.param['account_id'] ) ).children( ':first' ).hide().fadeIn();
						//timeline_list.prepend( MakeTimeline_DM( json, cp.param['timeline_type'], cp.param['account_id'] ) );
						status_ids[json.id_str] = true;
						addcnt++;
					}
				}

				// 一番新しいツイートのID更新
				last_status_id = json.id_str;

				if ( addcnt > 0 )
				{
					// 新着ツイートにスクロールする
					if ( g_cmn.cmn_param['newscroll'] && _sctop == 0 && !cursor_on_option )
					{
					}
					else
					{
						timeline_list.scrollTop( _sctop + ( timeline_list.find( '> div.item:eq(0)' ).outerHeight() ) );
					}

					timeline_list.find( '> div.item:lt(1)' ).addClass( 'new' );
					newitems = $( timeline_list.find( '> div.item.new' ).get() );

					badge.html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					$( '#panellist' ).find( '> .lists > div[panel_id=' + cp.id + ']' ).find( 'span.badge' ).hide().html( ( newitems.length > 999 ) ? '999+' : newitems.length ).show();
					timeline_list.trigger( 'scroll' );

					// 表示最大数を超えている件数
					var itemcnt = StatusIDCount();

					if ( itemcnt - cp.param['max_count'] > 0 )
					{
						// 新着で読み込んだ分だけ削除
						timeline_list.find( '> div.item:gt(' + ( itemcnt - addcnt - 1 ) + ')' ).each( function() {
							delete status_ids[$( this ).attr( 'status_id' )];
//							timeline_list.scrollTop( timeline_list.scrollTop() - $( this ).outerHeight() );
							$( this ).remove();
						} );

						first_status_id = timeline_list.find( '> div.item:last' ).attr( 'status_id' );
					}

					// アイコンサイズ
					var items = timeline_list.find( '> div.item:lt(1)' );

					items.find( 'div.icon' ).css( { width: g_cmn.cmn_param['iconsize'] } )
						.find( '> img' ).css( { width: g_cmn.cmn_param['iconsize'], height: g_cmn.cmn_param['iconsize'] } )
						.end()
						.find( '.retweet img' ).css( { width: g_cmn.cmn_param['iconsize'] * 0.7, height: g_cmn.cmn_param['iconsize'] * 0.7 } );

					// ユーザーごとのアイコンサイズ適用
					SetUserIconSize( items );

					// 引用元表示
					QuoteSource( items );
				}
			} );
		}
	};

	////////////////////////////////////////////////////////////
	// 設定画面初期化
	////////////////////////////////////////////////////////////
	function SettingInit()
	{
		setting.find( '.tlsetting_apply' ).addClass( 'disabled' );

		// 現行値設定(スライダー)

		// 検索、ユーザーTL、リストは最小30秒(devモードは10秒)にできるようにする
		var min = 60;

		if ( cp.param['timeline_type'] == 'user' ||
			 cp.param['timeline_type'] == 'list' ||
			 cp.param['timeline_type'] == 'search' )
		{
			if ( g_devmode )
			{
				min = 10;
			}
			else
			{
				min = 30;
			}
		}

		setting.find( '.set_reload_time' ).slider( {
			min: min,
			max: 600,
			step: 30,
			value: cp.param['reload_time'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_reload_time' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0270' ) );
			},
		} );

		setting.find( '.set_get_count' ).slider( {
			min: 20,
			max: 200,
			step: 10,
			value: cp.param['get_count'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_get_count' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0204' ) );

				if ( setting.find( '.set_max_count' ).slider( 'value' ) < ui.value )
				{
					setting.find( '.set_max_count' ).slider( 'value', ui.value );
				}

				setting.find( '.set_max_count' ).slider( 'option', {
					min: ui.value,
				} );

				setting.find( '.set_max_count' ).parent().find( '.value_disp' ).html( setting.find( '.set_max_count' ).slider( 'value' ) + chrome.i18n.getMessage( 'i18n_0204' ) );
			},
		} );

		setting.find( '.set_max_count' ).slider( {
			min: cp.param['get_count'],
			max: 1000,
			step: 10,
			value: cp.param['max_count'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_max_count' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0204' ) );
			},
		} );

		var _users = {};

		// グループ設定
		if ( cp.param['timeline_type'] == 'group' )
		{
			// アカウント
			var acclist = setting.find( '.acclist' );

			var account_id;

			for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
			{
				account_id = g_cmn.account_order[i];
				acclist.append( OutputTPL( 'tlsetting_accsel', { item: g_cmn.account[account_id], account_id: account_id } ) );

				if ( account_id == cp.param['account_id'] )
				{
					acclist.find( 'div:last' ).addClass( 'selected' );
				}
			}

			acclist.find( 'div' ).on( 'click', function( e ) {
				acclist.find( 'div' ).removeClass( 'selected' );
				$( this ).addClass( 'selected' );

				if ( $( this ).attr( 'account_id' ) != cp.param['account_id'] )
				{
					setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				}

				e.stopPropagation();
			} );

			// メンバー
			var MakeMemberList = function() {
				var member_list = setting.find( '.member_list' );
				var cnt = 0;

				var s = '';

				for ( var user_id in _users )
				{
					s += OutputTPL( 'tlsetting_member', { item: _users[user_id] } );
					cnt++;
				}

				if ( s == '' )
				{
					s = '<span>' + chrome.i18n.getMessage( 'i18n_0162' ) + '</span>';
				}

				member_list.html( s );

				member_list.find( 'div' ).on( 'click', function( e ) {
					var account_id = setting.find( '.acclist' ).find( 'div.selected' ).attr( 'account_id' );

					if ( account_id )
					{
						OpenUserTimeline( $( this ).find( 'img' ).attr( 'tooltip' ), account_id );
					}

					e.stopPropagation();
				} )
				.on( 'contextmenu', function( e ) {
					var user_id = $( this ).attr( 'user_id' );

					delete _users[user_id];

					MakeMemberList();
					setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
					$( '#tooltip' ).hide();

					return false;
				} );

				setting.find( '.memcnt' ).html( cnt );
			};

			for ( var user_id in cp.param['users'] )
			{
				_users[user_id] = cp.param['users'][user_id];
			}

			MakeMemberList();

			// ドロップ処理
			setting.find( '.member_list' ).on( 'itemdrop', function( e, ui ) {
				if ( ui.draggable.hasClass( 'user' ) &&  ui.draggable.hasClass( 'fromtl' ) )
				{
					if ( setting.find( '.memcnt' ).html() == '300' )
					{
						MessageBox( chrome.i18n.getMessage( 'i18n_0069' ) );
					}
					else
					{
						var dropuser = {
							user_id: ui.draggable.attr( 'user_id' ),
							screen_name: ui.draggable.attr( 'screen_name' ),
							icon: ui.draggable.attr( 'icon' ),
							account_id: ui.draggable.attr( 'account_id' ),
							created_at: ui.draggable.attr( 'created_at' ),
						};

						_users[dropuser.user_id] = dropuser;

						MakeMemberList();
						setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
					}
				}
			} );

			setting.find( '.member_list' ).droppable( {
				accept: '.dropitem',
				greedy: true,
				drop: function( e, ui ) {
					setting.find( '.member_list' ).trigger( 'itemdrop', [ ui ] );
				},
			} );

			setting.find( '.set_title' ).keyup( function() {
				if ( $( this ).val() != cp.param['title'] )
				{
					setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
				}
			} );
		}

		////////////////////////////////////////
		// 設定変更時処理
		////////////////////////////////////////
		setting.find( 'input' ).change( function( e ) {
			setting.find( '.tlsetting_apply' ).removeClass( 'disabled' );
		} );

		////////////////////////////////////////
		// 適用ボタンクリック処理
		////////////////////////////////////////
		setting.find( '.tlsetting_apply' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// タイムラインに表示する最大ツイート数
			cp.param['max_count'] = setting.find( '.set_max_count' ).slider( 'value' );

			// グループ設定
			if ( cp.param['timeline_type'] == 'group' )
			{
				// タイトル
				var title = setting.find( '.set_title' ).val();

				if ( title.length <= 0 )
				{
					MessageBox( chrome.i18n.getMessage( 'i18n_0076' ) );
					setting.find( '.set_title' ).focus();
					return false;
				}

				cp.param['title'] = title;
				cp.SetTitle( title, true );

				// アカウント
				var account_id = '';

				setting.find( '.acclist' ).find( 'div' ).each( function() {
					if ( $( this ).hasClass( 'selected' ) )
					{
						account_id = $( this ).attr( 'account_id' );
						return false;
					}
				} );

				cp.param['account_id'] = account_id;

				// メンバー
				cp.param['users'] = _users;

				cp.param['count'] = 0;

				for ( var user_id in _users )
					cp.param['count']++;

				// グループパネル管理に登録
				var _id = cp.id.replace( /^panel_/, '' );

				g_cmn.group_panel[_id] = {
					id: _id,
					param: cp.param,
				};

				// グループパネル一覧を表示している場合は一覧更新
				var pid = IsUnique( 'grouplist' );

				if ( pid != null )
				{
					$( '#grouplist_reload' ).trigger( 'click' );
					SetFront( p );
				}
			}
			// その他
			else
			{
				// 新着読み込み
				cp.param['reload_time'] = setting.find( '.set_reload_time' ).slider( 'value' );

				timeline_list.trigger( 'reload_timer' );

				// 一度に取得するツイート数
				cp.param['get_count'] = setting.find( '.set_get_count' ).slider( 'value' );

				// 新着あり通知
				cp.param['notify_new'] = ( setting.find( '.set_notify_new' ).prop( 'checked' ) ) ? 1 : 0;

				// 検索対象言語
				if ( cp.param['timeline_type'] == 'search' )
				{
					cp.param['search_lang'] = setting.find( 'input[class=set_search_lang]:checked' ).val();
				}
			}

			setting.find( '.tlsetting_apply' ).addClass( 'disabled' );

			SaveData();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 分類部クリック処理
		////////////////////////////////////////
		setting.find( '.kind' ).click( function( e ) {
			var img_off = 'icon-play';
			var img_on = 'icon-arrow_down';

			if ( $( this ).find( '> span' ).hasClass( img_on ) )
			{
				$( this ).find( '> span' ).removeClass( img_on ).addClass( img_off )
					.end()
					.next().slideUp( 0 );
			}
			else
			{
				$( this ).find( '> span' ).removeClass( img_off ).addClass( img_on )
					.end()
					.next().slideDown( 200 );
			}

			e.stopPropagation();
		} );

//		setting.find( '.kind' ).trigger( 'click' );
	}

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
		if ( tm != null )
		{
			clearTimeout( tm );
			tm = null;
		}
	};
}
