"use strict";

////////////////////////////////////////////////////////////////////////////////
// トレンド
////////////////////////////////////////////////////////////////////////////////
Contents.trends = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var scrollPos = null;
	var tm = null;

	cp.SetIcon( 'icon-search' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function() {
		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'trends/place.json',
			data: {
				id: cp.param['woeid'],
			},
		};

		cont.activity( { color: '#ffffff' } );

		// 更新時点の先頭アカウントで取得
		if ( g_cmn.account_order.length > 0 )
		{
			cp.param['account_id'] = g_cmn.account_order[0];
		}

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
					cont.find( '#trends_list' ).html( OutputTPL( 'trends_list', { items: res.json[0].trends } ) )
						.trigger( 'contents_resize' );

					$.each( res.json[0].trends, function( i, val ) {
						var chk = true;
						var txt;

						if ( !val.name.match( /^#/ ) )
						{
							return true;
						}
						else
						{
							txt = RegExp.rightContext;
						}

						for ( var j = 0, _len = g_cmn.notsave.tl_hashtag.length ; j < _len ; j++ )
						{
							if ( g_cmn.notsave.tl_hashtag[j].hashtag == txt )
							{
								chk = false;
								break;
							}
						}

						if ( chk )
						{
							g_cmn.notsave.tl_hashtag.push( { hashtag: txt } );
						}
					} );

					// ハッシュタグプルダウンを更新
					$( 'div.contents' ).trigger( 'hashtag_pulldown_update' );

					////////////////////////////////////////
					// クリック時処理
					////////////////////////////////////////
					cont.find( '#trends_list' ).find( '.item span' ).click( function( e ) {

						OpenSearchResult( decodeURIComponent( $( this ).attr( 'query' ) ), cp.param['account_id'] );

						e.stopPropagation();
					} );
				}
				else
				{
					ApiError( chrome.i18n.getMessage( 'i18n_0096' ), res );
				}

				cont.activity( false );

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );
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
				if ( scrollPos == null )
				{
					scrollPos = cont.find( '#trends_list' ).scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					cont.find( '#trends_list' ).scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			cont.find( '#trends_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 先頭のアカウントでトレンド取得
		if ( g_cmn.account_order.length > 0 )
		{
			cp.param['account_id'] = g_cmn.account_order[0];
		}

		////////////////////////////////////////
		// このパネルを開いたアカウントが
		// 削除された場合
		////////////////////////////////////////
		var AccountAliveCheck = function() {
			// 先頭のアカウントでトレンド取得
			if ( g_cmn.account_order.length > 0 )
			{
				cp.param['account_id'] = g_cmn.account_order[0];
			}
			else
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

		// 全体を作成
		cont.addClass( 'trends' )
			.html( OutputTPL( 'trends', {} ) );

		if ( cp.param['woeid'] == undefined )
		{
			// 都市の初期設定は日本
			cp.param['woeid'] = '23424856';
		}

		////////////////////////////////////////
		// 新着読み込みタイマー開始
		////////////////////////////////////////
		cont.on( 'reload_timer', function() {
			// タイマーを止める
			if ( tm != null )
			{
				clearInterval( tm );
				tm = null;
			}

			// タイマー起動
			tm = setInterval( function() {
				ListMake();
			}, 3 * 60 * 1000 );
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '#trends_reload' ).click( function( e ) {
			cont.trigger( 'reload_timer' );
			ListMake();
		} );

		////////////////////////////////////////////////////////////
		// 都市リストを取得する
		////////////////////////////////////////////////////////////
		
		var param = {
			type: 'GET',
			url: ApiUrl( '1.1' ) + 'trends/available.json',
			data: {
			},
		};

		$( '#woeids' ).find( '.selectitems' ).hide();

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
				var woeids = new Array();

				if ( res.status == 200 )
				{
					woeids = res.json;
				}
				else
				{
					ApiError( chrome.i18n.getMessage( 'i18n_0283' ), res );

					// 取得失敗したときは日本のみ
					woeids.push( {
						parentid: 1,
						name: chrome.i18n.getMessage( 'i18n_0261' ),
						woeid: '23424856',
					} );
				}

				woeids.sort( function( a, b ) {
					return ( a['name'] > b['name'] ) ? 1: -1;
				} );

				// 都市選択メニュー作成
				var s = '';

				for ( var i = 0, _len = woeids.length ; i < _len ; i++ )
				{
					s += OutputTPL( 'trends_woeid', {
							woeid: woeids[i].woeid,
							selected: ( cp.param['woeid'] == woeids[i].woeid ) ? 'selected' : '',
							bold: ( woeids[i].parentid == 1 || woeids[i].woeid == 1 ) ? 'bold' : '',
							name: woeids[i].name,
						} );

					if ( cp.param['woeid'] == woeids[i].woeid )
					{
						$( '#woeids' ).find( '.selitem' ).html( escapeHTML( woeids[i].name ) );
					}
				}

				// メニュー開閉
				$( '#woeids' ).click( function() {
					var len = $( '#woeids' ).find( '.selectitems > .selectitem' ).length;

					// 開くときに都市一覧を描く
					if ( len == 0 )
					{
						$( '#woeids' ).find( '.selectitems' ).html( s ).css( {
							top: $( '#woeids' ).position().top + $( '#woeids' ).height(),
						} );

						$( '#woeids' ).find( '.selectitem.selected' ).removeClass( 'selected' );
						$( '#woeids' ).find( '.selectitem[value=' + cp.param['woeid'] + ']' ).addClass( 'selected' );
					}

					$( this ).find( '.selectitems' ).slideToggle( 200, function() {
						$( this ).scrollTop( $( this ).find( '.selectitem.selected' ).prop( 'offsetTop' ) );

						// 閉じるときに消す
						if ( len != 0 )
						{
							$( '#woeids' ).find( '.selectitems' ).html( '' );
						}
					} );
				} );

				// 選択変更
				$( '#woeids' ).find( '.selectitems' ).click( function( e ) {
					var item = $( e.target );

					if ( item.hasClass( 'selectitem' ) )
					{
						var new_woeid = item.attr( 'value' );

						$( '#woeids' ).trigger( 'click' );

						// 変更があったらトレンド更新
						if ( cp.param['woeid'] != new_woeid )
						{
							$( this ).find( '.selectitem' ).removeClass( 'selected' );
							item.addClass( 'selected' );

							cp.param['woeid'] = new_woeid;

							$( '#woeids' ).find( '.selitem' ).html( escapeHTML( item.html() ) );

							setTimeout( function() {
								ListMake();
							}, 1 );

							cont.trigger( 'reload_timer' );
						}
					}

					e.stopPropagation();
				} );

				setTimeout( function() {
					ListMake();
				}, 1 );

				$( 'panel' ).find( 'div.contents' ).trigger( 'api_remaining_update', [cp.param['account_id']] );

				cont.trigger( 'reload_timer' );
			}
		);
	};

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
