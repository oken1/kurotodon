"use strict";

// 共通データ
var g_cmn = {
	cmn_param:	{											// 共通パラメータ
		font_family:		'',								// - フォント名
		font_size:			12,								// - フォントサイズ
		scroll_vertical:	1,								// - ページ全体のスクロールバー(縦)
		scroll_horizontal:	1,								// - ページ全体のスクロールバー(横)
		locale:				'ja',							// - 言語

		tootkey:			0,								// - トゥートショートカットキー

		reload_time:		30,								// - 新着読み込み
		get_count:			40,								// - 一度に取得する件数
		max_count:			100,							// - タイムラインに表示する最大件数
		newscroll:			1,								// - 新着ツイートにスクロール
		follow_mark:		1,								// - 相互フォロー表示

		nowbrowsing_text:	'Now Browsing: ',				// - Now Browsingテキスト
	},
	panel:			null,			// パネル
	account:		null,			// アカウント
	toolbar_user:	null,			// ツールバーに登録しているユーザ
	rss_panel:		null,			// RSSパネル

	account_order:	null,			// アカウントの並び順
	panellist_width: '200px',		// パネルリストの幅
	current_version: '',			// 現在のバージョン
};

// データ読み込み完了フラグ
var g_loaded = false;

// 終了時データ保存
var g_saveend = true;

var g_testmode = true;

// manifest
var manifest;

var g_defwidth, g_defheight, g_defheight_s, g_defheight_l;

////////////////////////////////////////////////////////////////////////////////
// 初期化処理
////////////////////////////////////////////////////////////////////////////////
function Init()
{
	$( '#tooltip' ).hide();
	$( '#blackout' ).hide();
	$( '#messagebox' ).hide();

	g_cmn.panel = new Array();
	g_cmn.account = {};
	g_cmn.toolbar_user = new Array();
	g_cmn.notsave = {};
	g_cmn.notsave.instances = {};
	g_cmn.account_order = new Array();
	g_cmn.rss_panel = {};

	$( document ).on( 'drop dragover', function( e ) {
		if ( e.target.tagName.match( /textarea/i ) || ( e.target.tagName.match( /input/i ) && e.target.type.match( /text/i ) ) )
		{
			if ( e.type == 'drop' && e.originalEvent.dataTransfer.files.length )
			{
				e.preventDefault();
				e.stopPropagation();
			}

			return true;
		}

		e.preventDefault();
		e.stopPropagation();
	} );

	// パネルリスト
	$( '#panellist' ).resizable( {
		handles: 'e',
		minWidth: '16',
		stop: function() {
			g_cmn.panellist_width = $( '#panellist' ).css( 'width' );

			// パネルリストを被せない対応
			$( '#main' ).css( { position: 'absolute', left: g_cmn.panellist_width } );
		},
	} );

	$.ajax( {
		type: 'GET',
		url: 'manifest.json',
		data: {},
		dataType: 'json',
		async: false
	} ).done( function( data ) {
		manifest = data;

		$( '#main' ).append( '<div id="version">' + manifest.name + ' version ' + manifest.version + '</div>' );
	} );

	Blackout( true );
	Loading( true, 'loaddata' );

	////////////////////////////////////////////////////////////
	// 保存データを読み込み、アカウント、パネルを復元する
	////////////////////////////////////////////////////////////
	var LoadData = function() {
		// localStorageからデータ読み込み
		var text = getUserInfo( 'g_cmn_V1' );

		if ( text != '' )
		{
			text = decodeURIComponent( text );
			var _g_cmn = JSON.parse( text );

			// 共通パラメータの復元
			for ( var p in _g_cmn.cmn_param )
			{
				// 削除されたパラメータは無視
				if ( g_cmn.cmn_param[p] == undefined )
				{
					continue;
				}

				g_cmn.cmn_param[p] = _g_cmn.cmn_param[p];
			}

			// 言語ファイル設定
			SetLocaleFile();

			// ツールバー
			$( '#head' ).html( OutputTPL( 'header', {} ) );
			$( '#head' ).find( '.header_sub' ).hide();

			// フォントサイズ
			SetFont();

			// ページ全体のスクロールバー
			$( 'body' ).css( { 'overflow-y': ( g_cmn.cmn_param['scroll_vertical'] == 1 ) ? 'auto' : 'hidden' } );
			$( 'body' ).css( { 'overflow-x': ( g_cmn.cmn_param['scroll_horizontal'] == 1 ) ? 'auto' : 'hidden' } );

			////////////////////////////////////////
			// 後続処理
			// （アカウントの復元後に実行する）
			////////////////////////////////////////
			var Subsequent = function() {
				// ツールバーユーザの復元
				if ( _g_cmn.toolbar_user != undefined )
				{
					g_cmn.toolbar_user = _g_cmn.toolbar_user;
				}

				UpdateToolbarUser();

				// RSSパネルの復元
				if ( _g_cmn.rss_panel != undefined )
				{
					g_cmn.rss_panel = _g_cmn.rss_panel;
				}

				// アカウントの並び順
				if ( _g_cmn.account_order != undefined )
				{
					g_cmn.account_order = _g_cmn.account_order;

					// 削除されているアカウントを取り除く
					for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
					{
						if ( g_cmn.account[g_cmn.account_order[i]] == undefined )
						{
							g_cmn.account_order.splice( i, 1 );
							i--;
						}
					}
				}
				else
				{
					for ( var id in g_cmn.account )
					{
						g_cmn.account_order.push( id.toString() );
					}
				}

				// パネルリストの幅
				if ( _g_cmn.panellist_width != undefined )
				{
					 g_cmn.panellist_width = _g_cmn.panellist_width;
				}

				// 現在のバージョン
				if ( _g_cmn.current_version != undefined )
				{
					 g_cmn.current_version = _g_cmn.current_version;
				}

				if ( g_cmn.current_version != '' )
				{
					if ( g_cmn.current_version != manifest.version )
					{
						MessageBox( i18nGetMessage( 'i18n_0345', [g_cmn.current_version, manifest.version] ), 5 * 1000 );
					}
				}

				g_cmn.current_version = manifest.version;

				// パネルの復元
				var cp;

				for ( var i = 0, _len = _g_cmn.panel.length ; i < _len ; i++ )
				{
					cp = new CPanel( _g_cmn.panel[i].x, _g_cmn.panel[i].y,
									 _g_cmn.panel[i].w, _g_cmn.panel[i].h,
									 _g_cmn.panel[i].id.replace( /^panel_/, '' ),
									 _g_cmn.panel[i].minimum,
									 _g_cmn.panel[i].zindex,
									 _g_cmn.panel[i].status,
									 true );

					if ( _g_cmn.panel[i].type == null )
					{
						continue;
					}

					cp.SetType( _g_cmn.panel[i].type );
					cp.SetTitle( _g_cmn.panel[i].title, _g_cmn.panel[i].setting );
					cp.SetParam( _g_cmn.panel[i].param );
					cp.Start();
				}

				g_loaded = true;
			};

			// アカウントの復元
			var _cnt = 0;
			var _comp = 0;
			var account_order = [];

			for ( var id in _g_cmn.account )
			{
				_cnt++;
				account_order.push( id );
			}

			// アカウント情報なし
			if ( _cnt == 0 )
			{
				// 後続処理を実行
				Blackout( false );
				Loading( false, 'loaddata' );
				Subsequent();
			}
			// アカウント情報あり
			else
			{
				var _comp = 0;

				// アカウント情報を更新
				Blackout( true );

				function GetAccountInfo()
				{
					var account_id = account_order[_comp];

					// アカウント情報初期設定値
					g_cmn.account[account_id] = {
						client_id: '',
						client_secret: '',
						instance: '',
						access_token: '',
						id: '',
						username: '',
						display_name: '',
						avatar: '',
						privacy: '0',
						notsave: {},
					};

					for ( var p in _g_cmn.account[account_id] )
					{
						// 削除されたパラメータは無視
						if ( g_cmn.account[account_id][p] == undefined )
						{
							continue;
						}

						g_cmn.account[account_id][p] = _g_cmn.account[account_id][p];
					}

					$( '#blackout' ).append( OutputTPL( 'blackoutinfo', {
						id: 'info0_' + _comp,
						msg: i18nGetMessage( 'i18n_0046' ) + '(' + g_cmn.account[account_id]['display_name'] +
							 '@' + g_cmn.account[account_id]['instance'] + ')' } ) );

					SendRequest(
						{
							method: 'GET',
							action: 'api_call',
							instance: g_cmn.account[account_id].instance,
							api: 'accounts/verify_credentials',
							access_token: g_cmn.account[account_id].access_token,
						},
						function( res )
						{
							if ( res.status === undefined )
							{
								g_cmn.account[account_id].username = res.username;
								g_cmn.account[account_id].display_name = res.display_name;
								g_cmn.account[account_id].avatar = ImageURLConvert( res.avatar, res.acct, g_cmn.account[account_id].instance );
								g_cmn.account[account_id].notsave.statuses_count = res.statuses_count;
								g_cmn.account[account_id].notsave.following_count = res.following_count;
								g_cmn.account[account_id].notsave.followers_count = res.followers_count;
							}
							else
							{
								ApiError( res );
							}

							$( '#info0_' + _comp ).append( ' ... completed' ).fadeOut( 'slow', function() { $( this ).remove() } );
							_comp++;

							if ( _comp >= _cnt )
							{
								var _next = function() {
									if ( $( '#blackout' ).find( 'div.info' ).length == 0 )
									{
										Blackout( false );
										Loading( false, 'loaddata' );
										Subsequent();
										$( '#head' ).trigger( 'account_update' );
									}
									else
									{
										setTimeout( function() { _next(); }, 100 );
									}
								};

								_next();
							}
							else
							{
								GetAccountInfo();
							}
						}
					);
				}
				
				GetAccountInfo();
			}
		}
		else
		{
			// 初回起動

			Blackout( false );
			Loading( false, 'loaddata' );

			// フォントサイズ
			SetFont();

			// 言語選択
			$( '#main' ).html( OutputTPL( 'select_locale', {} ) );
			$( '#select_locale' ).find( 'select' ).val( g_cmn.cmn_param['locale'] );

			$( '#select_locale' ).find( '.btn' ).on( 'click', function() {
				g_cmn.cmn_param['locale'] = $( '#select_locale' ).find( 'select' ).val();

				g_loaded = true;

				// 言語ファイル設定
				SetLocaleFile();

				$( '#select_locale' ).remove();

				// ツールバー
				$( '#head' ).html( OutputTPL( 'header', {} ) );
				$( '#head' ).find( '.header_sub' ).hide();

				// アカウント画面を開く
				$( '#head_account' ).trigger( 'click' );
			} );
		}

		// 設定/状態保存の定期実行
		var AutoSave = function() {
			SaveData();

			setTimeout( AutoSave, 30 * 1000 );
		};

		setTimeout( AutoSave, 30 * 1000 );
	};

	LoadData();

	////////////////////////////////////////////////////////////
	// ツールボタンのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_tool', function( e ) {
		// disabledなら処理しない
		if ( $( this ).hasClass( 'disabled' ) )
		{
			return;
		}

		$( '#head_tool_sub' ).toggle()
			.css( { left: 0, top: $( this ).outerHeight() } );
	} );

	////////////////////////////////////////////////////////////
	// ツールメニューのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_tool_sub', function( e ) {
		switch ( $( e.target ).index() )
		{
			// RSSパネル一覧
			case 0:
				var pid = IsUnique( 'rsslist' );

				if ( pid == null )
				{
					var _cp = new CPanel( null, null, g_defwidth, g_defheight );
					_cp.SetType( 'rsslist' );
					_cp.SetParam( {} );
					_cp.Start();
				}
				else
				{
					SetFront( $( '#' + pid ) );

					// 最小化している場合は元に戻す
					if ( GetPanel( pid ).minimum.minimum == true )
					{
						$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
					}
				}

				break;
			// Now Browsing
			case 1:
				var pid = IsUnique( 'nowbrowsing' );

				if ( pid == null )
				{
					var _cp = new CPanel( null, null, g_defwidth, g_defheight_s );
					_cp.SetType( 'nowbrowsing' );
					_cp.SetParam( {} );
					_cp.Start();
				}
				else
				{
					SetFront( $( '#' + pid ) );

					// 最小化している場合は元に戻す
					if ( GetPanel( pid ).minimum.minimum == true )
					{
						$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
					}
				}

				break;
			// インポート/エクスポート
			case 2:
				var pid = IsUnique( 'impexp' );

				if ( pid == null )
				{
					var _cp = new CPanel( null, null, g_defwidth, g_defheight_s );
					_cp.SetType( 'impexp' );
					_cp.SetParam( {} );
					_cp.Start();
				}
				else
				{
					SetFront( $( '#' + pid ) );

					// 最小化している場合は元に戻す
					if ( GetPanel( pid ).minimum.minimum == true )
					{
						$( '#' + pid ).find( 'titlebar' ).find( '.minimum' ).trigger( 'click' );
					}
				}

				break;
		}

		$( this ).toggle();
	} );

	////////////////////////////////////////////////////////////
	// トゥートボタンのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_toot', function( e ) {
		// disabledなら処理しない
		if ( $( this ).hasClass( 'disabled' ) )
		{
			return;
		}

		var pid = IsUnique( 'tootbox' );

		if ( pid == null )
		{
			var _cp = new CPanel( null, null, g_defwidth, g_defheight_s );
			_cp.SetType( 'tootbox' );
			_cp.SetParam( { account_id: '' } );
			_cp.Start();
		}
		else
		{
			SetFront( $( '#' + pid ) );

			// 最小化している場合は元に戻す
			if ( GetPanel( pid ).minimum.minimum == true )
			{
				$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
			}
		}
	});

	////////////////////////////////////////////////////////////
	// アカウントボタンのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_account', function( e ) {
		var pid = IsUnique( 'account' );

		if ( pid == null )
		{
			var _cp = new CPanel( null, null, g_defwidth, g_defheight_s );
			_cp.SetType( 'account' );
			_cp.SetParam( {} );
			_cp.Start();
		}
		else
		{
			SetFront( $( '#' + pid ) );

			// 最小化している場合は元に戻す
			if ( GetPanel( pid ).minimum.minimum == true )
			{
				$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
			}
		}
	});

	////////////////////////////////////////////////////////////
	// 設定ボタンのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_setting', function( e ) {
		var pid = IsUnique( 'cmnsetting' );

		if ( pid == null )
		{
			var _cp = new CPanel( null, null, g_defwidth, g_defheight_l );
			_cp.SetType( 'cmnsetting' );
			_cp.SetParam( {} );
			_cp.Start();
		}
		else
		{
			SetFront( $( '#' + pid ) );

			// 最小化している場合は元に戻す
			if ( GetPanel( pid ).minimum.minimum == true )
			{
				$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
			}
		}
	});

	////////////////////////////////////////////////////////////
	// 検索ボタンのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_search', function( e ) {
		var pid = IsUnique( 'searchbox' );

		if ( pid == null )
		{
			var _cp = new CPanel( null, null, g_defwidth, g_defheight_s );
			_cp.SetType( 'searchbox' );
			_cp.SetParam( {} );
			_cp.Start();
		}
		else
		{
			SetFront( $( '#' + pid ) );

			// 最小化している場合は元に戻す
			if ( GetPanel( pid ).minimum.minimum == true )
			{
				$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
			}
		}
	});

	////////////////////////////////////////////////////////////
	// インスタンスを覗くボタンのクリック処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_peep', function( e ) {
		// disabledなら処理しない
		if ( $( this ).hasClass( 'disabled' ) )
		{
			return;
		}

		var pid = IsUnique( 'peep' );

		if ( pid == null )
		{
			var _cp = new CPanel( null, null, g_defwidth, g_defheight_s / 2 );
			_cp.SetType( 'peep' );
			_cp.SetParam( {} );
			_cp.Start();
		}
		else
		{
			SetFront( $( '#' + pid ) );

			// 最小化している場合は元に戻す
			if ( GetPanel( pid ).minimum.minimum == true )
			{
				$( '#' + pid ).find( 'div.titlebar' ).find( '.minimum' ).trigger( 'click' );
			}
		}
	});

	////////////////////////////////////////////////////////////
	// アカウント数変更時の処理
	////////////////////////////////////////////////////////////
	$( document ).on( 'account_update', '#head', function()
		{
			// ツイート、検索ボタンの有効/無効
			if ( AccountCount() > 0 )
			{
				$( '#head_search' ).removeClass( 'disabled' );
				$( '#head_toot' ).removeClass( 'disabled' );
			}
			else
			{
				$( '#head_search' ).addClass( 'disabled' );
				$( '#head_toot' ).addClass( 'disabled' );
			}

			// 各パネルの処理を呼ぶ
			$( 'panel' ).find( 'div.contents' ).trigger( 'account_update' );
		}
	);

	////////////////////////////////////////////////////////////////////////////////
	// パネルリスト表示
	////////////////////////////////////////////////////////////////////////////////
	$( document ).on( 'click', '#head_panellist', function() {
		if ( $( '#panellist' ).css( 'display' ) == 'none' )
		{
			// パネルリストを被せない対応
			$( '#main' ).css( { position: 'absolute' } ).animate( { left: g_cmn.panellist_width }, 200 );

			$( '#panellist' ).css( { display: 'block', top: $( '#head' ).outerHeight() } ).animate( { width: g_cmn.panellist_width }, 200 );
		}
		else
		{
			// パネルリストを被せない対応
			$( '#main' ).animate( { left: 0 }, 400 ).css( { position: 'relative' } );

			$( '#panellist' ).animate( { width: 0 }, 200, function() { $( '#panellist' ).css( { display: 'none' } ) } );
		}
	} );

	////////////////////////////////////////////////////////////
	// キーボードショートカット
	////////////////////////////////////////////////////////////
	$( window ).keydown( function( e ) {
		// ブラックアウト中は無効
		if ( $( '#blackout' ).css( 'display' ) != 'none' )
		{
			return;
		}

		// 画像ページ送り
		if ( $( 'panel' ).find( 'div.contents.image' ).length )
		{
			if ( e.keyCode == 37 || e.keyCode == 39 )
			{
				
				$( 'panel' ).find( 'div.contents.image' ).trigger( 'keyevent', [e] );
				return;
			}
		}

		// altを押していない場合は無視
		if ( e.altKey != true )
		{
			return;
		}

		var INITIAL_ELEMENT_ID = ''
		var element_id = INITIAL_ELEMENT_ID
		switch ( e.keyCode )
		{
			// alt+'w'でツイートパネル
			case 87:
				element_id = '#head_toot'
				break;
			// alt+'s'で検索パネル
			case 83:
				element_id = '#head_search'
				break;
			// alt+'a'でアカウントパネル
			case 65:
			  element_id = '#head_account'
				break;
			// alt+'p'でパネルリスト
			case 80:
			  element_id = '#head_panellist'
				break;
			default:
			  return;
		}

		if ( element_id == INITIAL_ELEMENT_ID )
		{
			return;
		}

		// Macでalt+<character>は別の文字列になり、フォーカスが移った後にその文字が入力さ
		// れてしまうのでデフォルト動作を無効化
		// e.g. alt+'w' = ∑
		e.preventDefault();
		$( element_id ).trigger( 'click' );
	} );
}

////////////////////////////////////////////////////////////////////////////////
// 終了処理
////////////////////////////////////////////////////////////////////////////////
window.onunload = window.onbeforeunload = function( e ) {
	// 全コンテンツの終了処理を実行
	for ( var i = 0, _len = g_cmn.panel.length ; i < _len ; i++ )
	{
		if ( g_cmn.panel[i].type != null )
		{
			g_cmn.panel[i].contents.stop();
		}
	}

	if ( !g_saveend )
	{
		return;
	}

	// データ読み込みが完了していない場合
	if ( g_loaded == false )
	{
		// データの上書きをしない
		return;
	}

	SaveData();

	g_saveend = false;
};

////////////////////////////////////////////////////////////////////////////////
// ツールチップ表示
////////////////////////////////////////////////////////////////////////////////
$( document ).on( 'mouseenter mouseleave', '.tooltip', function( e ) {
	if ( e.type == 'mouseenter' )
	{
		var tip = $( this ).attr( 'tooltip' );

		if ( tip == undefined )
		{
			return;
		}

		$( '#tooltip' ).css( { left: 0, top: 0, width: 'auto' } ).html( tip );

		var l, t, w;
		l = $( this ).offset().left + $( this ).outerWidth();
		t = $( this ).offset().top + 2;
		w = $( '#tooltip' ).outerWidth( true );

		// 画面外にでないように調整
		if ( l + $( '#tooltip' ).outerWidth( true ) + 8 > $( window ).width() + $( document ).scrollLeft() )
		{
			l = $( window ).width() - $( '#tooltip' ).outerWidth( true ) - 8 + $( document ).scrollLeft();
			t = $( this ).offset().top + $( this ).outerHeight() + 2;
		}

		$( '#tooltip' ).css( { top: t, left: l, width: w } ).show();
	}
	else
	{
		$( '#tooltip' ).hide();
	}
});

////////////////////////////////////////////////////////////////////////////////
// ブラックアウト
////////////////////////////////////////////////////////////////////////////////
function Blackout( flg )
{
	if ( flg )
	{
		$( '#blackout' ).show();
	}
	else
	{
		$( '#blackout' ).hide();
	}
}

////////////////////////////////////////////////////////////////////////////////
// ユニークコンテンツチェック
// ret)
//  null     ... 開かれていない
//  パネルID ... 開かれている
////////////////////////////////////////////////////////////////////////////////
function IsUnique( type )
{
	for ( var i = 0, _len = g_cmn.panel.length ; i < _len ; i++ )
	{
		if ( g_cmn.panel[i].type == type )
		{
			return g_cmn.panel[i].id;
		}
	}

	return null;
}

////////////////////////////////////////////////////////////////////////////////
// 指定したパネルIDのパネルオブジェクトを返す
////////////////////////////////////////////////////////////////////////////////
function GetPanel( panelid )
{
	for ( var i = 0, _len = g_cmn.panel.length ; i < _len ; i++ )
	{
		if ( g_cmn.panel[i].id == panelid )
		{
			return g_cmn.panel[i];
		}
	}

	return null;
}

////////////////////////////////////////////////////////////////////////////////
// データを保存する
////////////////////////////////////////////////////////////////////////////////
function SaveData()
{
	if ( g_loaded )
	{
		setUserInfo( 'g_cmn_V1', SaveDataText() );
	}
}

////////////////////////////////////////////////////////////////////////////////
// テンプレート出力
////////////////////////////////////////////////////////////////////////////////
var tpl_c = {};

function OutputTPL( name, assign )
{
	if ( tpl_c[name] == null || tpl_c[name] == undefined )
	{
		$.ajax( {
			type: 'GET',
			url: 'template/' + name + '.tpl',
			data: {},
			dataType: 'html',
			async: false
		} ).done( function( data ) {
			// 国際化対応
			data = data.replace( /\t/g, '' );

			var i18ns = data.match( /\(i18n_.+?\)/g );

			if ( i18ns )
			{
				for ( var i = 0, _len = i18ns.length ; i < _len ; i++ )
				{
					data = data.replace( i18ns[i], i18nGetMessage( i18ns[i].replace( /\W/g, "" ) ) );
				}
			}

			tpl_c[name] = new jSmart( data );
		} );
	}
	return tpl_c[name].fetch( assign );
}

////////////////////////////////////////////////////////////////////////////////
// アカウント数取得
////////////////////////////////////////////////////////////////////////////////
function AccountCount()
{
	return g_cmn.account_order.length;
}

////////////////////////////////////////////////////////////////////////////////
// 登録しているアカウントかチェック
////////////////////////////////////////////////////////////////////////////////
function IsMyAccount( account_id )
{
	for ( var id in g_cmn.account )
	{
		if ( id == account_id )
		{
			return id;
		}
	}

	return false;
}

////////////////////////////////////////////////////////////////////////////////
// 指定したパネルにアカウント選択ボックスを作成
////////////////////////////////////////////////////////////////////////////////
function AccountSelectMake( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	// アカウント未選択/指定されたアカウントが存在しない場合
	if ( cp.param.account_id == '' || g_cmn.account[cp.param['account_id']] == undefined )
	{
		// 先頭のアカウントを自動選択
		if ( g_cmn.account_order.length > 0 )
		{
			cp.param['account_id'] = g_cmn.account_order[0];
		}
	}

	// 選択したアカウント部
	var item = {
		account_id: cp.param['account_id'],
		avatar: g_cmn.account[cp.param['account_id']].avatar,
		display_name_disp: ConvertDisplayName( g_cmn.account[cp.param['account_id']].display_name, g_cmn.account[cp.param['account_id']].username ),
		display_name: g_cmn.account[cp.param['account_id']].display_name,
		instance: g_cmn.account[cp.param['account_id']].instance,
	};

	var account_select = cont.find( '.account_select' );

	account_select.html( OutputTPL( 'account_select', { item: item } ) );

	account_select.find( '.selectitem' ).click(
		function()
		{
			account_select.find( '.selectlist' ).slideToggle( 200, function() {
				account_select.find( '.selectlist' ).scrollTop( account_select.find( '.selectlist' ).find( '.item.select' ).position().top );
			} );
		}
	);

	// アカウント一覧部
	var selectlist = account_select.find( '.selectlist' );

	var items = new Array();
	var id;

	for ( var i = 0, _len = g_cmn.account_order.length ; i < _len ; i++ )
	{
		id = g_cmn.account_order[i];

		items.push( {
			display_name_disp: ConvertDisplayName( g_cmn.account[id]['display_name'], g_cmn.account[id]['username'] ),
			display_name: g_cmn.account[id]['display_name'],
			avatar: g_cmn.account[id]['avatar'],
			account_id: id,
			instance: g_cmn.account[id]['instance'],
		} );
	}

	var assign = {
		items: items,
	};

	selectlist.html( OutputTPL( 'account_select_list', assign ) );

	selectlist.find( '.item' ).each( function() {
		if ( $( this ).attr( 'account_id' ) == cp.param['account_id'] )
		{
			$( this ).addClass( 'select' );
			return false;
		}
	} );

	////////////////////////////////////////////////////////////
	// クリック時処理
	////////////////////////////////////////////////////////////
	selectlist.find( '.item' ).click( function( e ) {
		cp.param['account_id'] = $( this ).attr( 'account_id' );

		selectlist.slideToggle( 100, function() {
			AccountSelectMake( cp );
			cont.trigger( 'account_changed' );
		} );

		e.stopPropagation();
	} );

	selectlist.hide();
}

////////////////////////////////////////////////////////////////////////////////
// フォント設定
////////////////////////////////////////////////////////////////////////////////
function SetFont( formflg )
{
	if ( !formflg )
	{
		$( 'html,body' ).css( { fontSize: g_cmn.cmn_param.font_size + 'px', fontFamily: g_cmn.cmn_param.font_family } );
	}

	$( 'input[type=text]' ).css( { fontSize: g_cmn.cmn_param.font_size + 'px' } );
	$( 'input[type=password]' ).css( { fontSize: g_cmn.cmn_param.font_size + 'px' } );
	$( 'input[type=file]' ).css( { fontSize: g_cmn.cmn_param.font_size + 'px' } );
	$( 'textarea' ).css( { fontSize: g_cmn.cmn_param.font_size + 'px' } );
	$( 'select' ).css( { fontSize: g_cmn.cmn_param.font_size + 'px' } );

	for ( var i = 0 ; i < g_cmn.panel.length ; i++ )
	{
		var p = $( '#' + g_cmn.panel[i].id );

		g_cmn.panel[i].SetMinimumSize( p.outerWidth(), p.outerHeight(), p );

		// 最小化しているパネルのサイズ調整
		if ( g_cmn.panel[i].minimum.minimum == true )
		{
			p.css( {
				height: p.find( 'div.titlebar' ).outerHeight()
				+ parseInt( p.css( 'border-top-width' ) )
				+ parseInt( p.css( 'border-bottom-width' ) )
				- parseInt( p.find( 'div.titlebar' ).css( 'border-bottom-width' ) )
			} )
		}
	}
	
	// パネルのデフォルトサイズをフォントサイズをベースにする
	g_defwidth = g_cmn.cmn_param.font_size * 30;
	g_defheight = g_cmn.cmn_param.font_size * 30;
	g_defheight_s = g_cmn.cmn_param.font_size * 20;

	g_defheight_l = $( window ).height() * 0.75;
}

////////////////////////////////////////////////////////////////////////////////
// 指定したパネルを一番上に持ってくる
////////////////////////////////////////////////////////////////////////////////
function SetFront( p )
{
	var pzindex = p[0].style.zIndex;

	$( 'panel' ).each( function() {
		var zindex = $( this )[0].style.zIndex;

		if ( zindex > pzindex )
		{
			$( this ).css( 'zIndex', zindex - 1 );
		}
	} );

	p.css( 'zIndex', 100 + g_cmn.panel.length - 1 );
}


////////////////////////////////////////////////////////////////////////////////
// タイムライン作成
////////////////////////////////////////////////////////////////////////////////
function MakeTimeline( json, cp )
{
	var notification = null;
	var account_id = cp.param.account_id;

	// Notification
	if ( json.type )
	{
		notification = {
			type: json.type,
			id: json.account.id,
			username: json.account.username,
			display_name: json.account.display_name,
			display_name_disp: ConvertDisplayName( json.account.display_name, json.account.username ),
			instance: GetInstanceFromAcct( json.account.acct, g_cmn.account[account_id].instance ),
		};

		if ( json.type == 'follow' )
		{
			var assign = {
				notification: notification,
				instance: GetInstanceFromAcct( json.account.acct, g_cmn.account[account_id].instance ),
				id: json.account.id,
				display_name: json.account.display_name,
				display_name_disp: ConvertDisplayName( json.account.display_name, json.account.username ),
				avatar: ImageURLConvert( json.account.avatar, json.account.acct, g_cmn.account[account_id].instance ),
				username: json.account.username,
				status_id: json.id,
				created_at: json.created_at,
				statuses_count: NumFormat( json.account.statuses_count ),
				following: NumFormat( json.account.following_count ),
				followers: NumFormat( json.account.followers_count ),
			};

			return OutputTPL( 'timeline_follow', assign );
		}

		json = json.status;
	}

	var bt_flg = ( json.reblog );
	var bt_id = json.account.id;
	var bt_instance = GetInstanceFromAcct( json.account.acct, g_cmn.account[account_id].instance );
	var bt_display_name = json.account.display_name;
	var bt_display_name_disp = ConvertDisplayName( json.account.display_name, json.account.username );
	var bt_username = json.account.username;
	var bt_avatar = ImageURLConvert( json.account.avatar, json.account.acct, g_cmn.account[account_id].instance );

	if ( bt_flg )
	{
		var _json = json.reblog;
		json = _json;
	}

	var instance = GetInstanceFromAcct( json.account.acct, g_cmn.account[account_id].instance );

	// NSFW表示設定
	if ( cp.param.tl_nsfw == '1' )
	{
		json.sensitive = true;
	}
	else if ( cp.param.tl_nsfw == '2' )
	{
		json.sensitive = false;
	}

	// CWのカスタム絵文字
	if ( json.emojis )
	{
		for ( var i = 0 ; i < json.emojis.length ; i++ )
		{
			var shortcode = ':' + json.emojis[i].shortcode + ':';
			json.spoiler_text = json.spoiler_text.replace( new RegExp( shortcode, 'g' ),
						'<img class="emoji" alt="' + shortcode + '" title="' + shortcode + '" src="' + json.emojis[i].url + '">' );
		}
	}

	var assign = {
		id: json.account.id,
		status_id: json.id,
		created_at: json.created_at,

		avatar: ImageURLConvert( json.account.avatar, json.account.acct, g_cmn.account[account_id].instance ),
		statuses_count: NumFormat( json.account.statuses_count ),
		following: NumFormat( json.account.following_count ),
		followers: NumFormat( json.account.followers_count ),

		bt_flg: bt_flg,

		bt_id: bt_id,
		bt_instance: bt_instance,
		bt_display_name: bt_display_name,
		bt_display_name_disp: bt_display_name_disp,
		bt_username: bt_username,
		bt_avatar: bt_avatar,

		mytoot: ( !bt_flg && instance == g_cmn.account[account_id].instance && json.account.id == g_cmn.account[account_id].id ),
		visibility: json.visibility,

		display_name: json.account.display_name,
		display_name_disp : ConvertDisplayName( json.account.display_name, json.account.username ),
		username: json.account.username,
		instance: instance,
		acct: json.account.acct,
		application: json.application,

		btcnt: json.reblogs_count,
		favcnt: json.favourites_count,

		date: DateConv( json.created_at, 0 ),
		dispdate: DateConv( json.created_at, 3 ),

		spoiler_text: twemoji.parse( json.spoiler_text ),
		text: twemoji.parse( ConvertContent( json.content, json ) ),

		url : json.url,

		favourited: json.favourited,
		reblogged: json.reblogged,

		notification: notification,
	};

	return OutputTPL( 'timeline_toot', assign );
}


////////////////////////////////////////////////////////////////////////////////
// アイコンをドラッグできるようにする
////////////////////////////////////////////////////////////////////////////////
function SetDraggable( selector, p, cp )
{
	selector.draggable( {
		containment: 'document',
		opacity: 0.8,
		start: function() {
			$( '#main' ).addClass( 'dragon' );
			$( '#head' ).addClass( 'dragon' );

			var item = $( this ).parent().parent();

			if ( cp != null )
			{
				SetFront( p );
				$( this ).addClass( 'fromtl' );
			}
			$( this ).addClass( 'dropitem user' )
				.attr( {
					account_id: ( cp != null ) ? cp.param['account_id'] : null,
					created_at: item.attr( 'created_at' ),
					avatar: item.attr( 'avatar' ),
					display_name: item.attr( 'display_name' ),
					username: item.attr( 'username' ),
					id: item.attr( 'id' ),
					instance: item.attr( 'instance' ),
					type: ( item.attr( 'type' ) ) ? item.attr( 'type' ) : 'user',
				} );

			if ( !item.attr( 'drag_id' ) )
			{
				item.attr( 'drag_id', GetUniqueID() );
			}

			$( '#head_users' ).attr( 'currentdrag', item.attr( 'drag_id' ) );

			$( 'body' ).css( { pointerEvents: 'none' } );
		},
		stop: function( e, ui ) {
			$( '#main' ).removeClass( 'dragon' );
			$( '#head' ).removeClass( 'dragon' );

			$( this ).removeClass( 'dropitem user' );

			$( 'body' ).css( { pointerEvents: 'auto' } );

			var dropuser;
			var dropuseridx = 0;

			// ツールバーから
			if ( !$( this ).hasClass( 'fromtl' ) )
			{
				var idx = $( '#head_users' ).find( '>div[drag_id="' + $( '#head_users' ).attr( 'currentdrag' ) + '"]' ).index();

				dropuser = g_cmn.toolbar_user[idx];
				g_cmn.toolbar_user.splice( idx, 1 );
				dropuseridx = idx;
			}
			// TLから
			else
			{
				if ( IsToolbarUser( $( this ).attr( 'account_id' ), $( this ).attr( 'id' ), $( this ).attr( 'instance' ) ) == -1 )
				{
					dropuser = {
						account_id: $( this ).attr( 'account_id' ),
						created_at: $( this ).attr( 'created_at' ),
						avatar: $( this ).attr( 'avatar' ),
						display_name: $( this ).attr( 'display_name' ),
						username: $( this ).attr( 'username' ),
						id: $( this ).attr( 'id' ),
						instance: $( this ).attr( 'instance' ),
						type: $( this ).attr( 'type' ),
					};
				}
				else
				{
					$( '#head_users' ).removeAttr( 'currentdrag' );
					$( '#head_users div' ).removeClass( 'iconover' );
					return;
				}
			}

			// 情報を挿入する
			var insflg = false;

			$( '#head_users > div' ).each( function() {
				if ( $( this ).hasClass( 'iconover' ) )
				{
					// 右端
					if ( $( this ).hasClass( 'dmy' ) )
					{
						g_cmn.toolbar_user.push( dropuser );
						insflg = true;
					}
					else
					{
						var index = IsToolbarUser( $( this ).attr( 'account_id' ), $( this ).attr( 'id' ), $( this ).attr( 'instance' ) );

						if ( index != -1 )
						{
							g_cmn.toolbar_user.splice( index, 0, dropuser );
							insflg = true;
						}
					}

					return false;
				}
			} );

			if ( !insflg )
			{
				// TLから
				if ( $( this ).hasClass( 'fromtl' ) )
				{
					var l = ui.offset.left - $( document ).scrollLeft() ;
					var t = ui.offset.top - $( document ).scrollTop();
					var head = $( '#head' );
					var hl = head.position().left;
					var ht = head.position().top;
					var hw = head.outerWidth();
					var hh = head.outerHeight();

					if ( l >= hl && l <= hl + hw && t >= ht && t <= ht + hh )
					{
						g_cmn.toolbar_user.push( dropuser );
					}
				}
				// ツールバーから
				else
				{
					g_cmn.toolbar_user.splice( dropuseridx, 0, dropuser );
				}
			}

			$( '#head_users' ).removeAttr( 'currentdrag' );
			UpdateToolbarUser();

			$( '#head_users div' ).removeClass( 'iconover' );
		},
		drag: function( e, ui ) {
			var l = ui.offset.left - $( document ).scrollLeft();
			var t = ui.offset.top - $( document ).scrollTop();
			var head = $( '#head' );
			var hl = head.position().left;
			var ht = head.position().top;
			var hw = head.outerWidth();
			var hh = head.outerHeight();

			if ( l >= hl && l <= hl + hw && t >= ht && t <= ht + hh )
			{
				$( '#head_users > div' )
					.removeClass( 'iconover' )
					.each( function() {
						var dl = $( this ).position().left;
						var dt = $( this ).position().top;
						var dw = $( this ).outerWidth();
						var dh = $( this ).outerHeight();
						var id = $( this ).attr( 'drag_id' );

						if ( l >= dl - dw / 2 && l < dl + dw - dw / 2 && t >= dt && t <= dt + dh && $( '#head_users' ).attr( 'currentdrag' ) != id )
						{
							$( this ).addClass( 'iconover' );
							return false;
						}
					} );
			}
		},

		appendTo: 'body',
		zIndex: 2000,
		helper: 'clone',
	} );
}


////////////////////////////////////////////////////////////////////////////////
// テキストエリアのカーソル位置設定
////////////////////////////////////////////////////////////////////////////////
$.fn.extend( {
	SetPos: function( pos ) {
		var elem = this.get( 0 );

		if ( pos == 'start' )
		{
			pos = 0;
		}
		else if ( pos == 'end' )
		{
			pos = elem.value.length;
		}

		if ( elem != undefined )
		{
			elem.focus();

			if ( elem.createTextRange )
			{
				var range = elem.createTextRange();
				range.move( 'character', pos );
				range.select();
			}
			else if ( elem.setSelectionRange )
			{
				elem.setSelectionRange( pos, pos );
			}
		}
	}
} );


////////////////////////////////////////////////////////////////////////////////
// メッセージ出力
////////////////////////////////////////////////////////////////////////////////
var messages = new Array();

function MessageBox( msg, time )
{
	var MessageUpdate = function() {
		for ( var i = 0, s = '', _len = messages.length ; i < _len ; i++ )
		{
			s += messages[i].msg;
		}

		if ( s == '' )
		{
			$( '#messagebox' ).css( 'visibility', 'hidden' );
		}
		else
		{
			$( '#messagebox_body' ).html( s );
		}
	};

	msg = '<div><div class="msg">' + msg.replace( /\n/g, '<br>' ) + '</div></div>';

	messages.push( {
		msg: msg,
		tm: setTimeout( function() {
			messages.splice( 0, 1 );
			MessageUpdate();
		}, ( time ) ? time : 20 * 1000 ),
	} );

	// 初回表示
	if ( $( '#messagebox' ).css( 'display' ) == 'none' )
	{
		$( '#messagebox' ).show()
			.draggable( {
				cursor: 'move',
			} )
			.html( OutputTPL( 'messagebox', {} ) );

		var w = $( '#messagebox' ).outerWidth();
		var h = $( '#messagebox' ).outerHeight();

		$( '#messagebox' ).css( {
			left: ( $( '#main' ).width() - w ) / 2,
			top: ( $( '#main' ).height() - h ) / 2 - $( '#head' ).height(),
		} );

		$( '#messagebox_foot' ).find( '.btn' ).click( function( e ) {
			$( '#messagebox' ).css( 'visibility', 'hidden' );

			// メッセージをクリア
			for ( var i = 0, _len = messages.length ; i < _len ; i++ )
			{
				clearTimeout( messages[i].tm );
			}

			messages = [];

			MessageUpdate();

			e.stopPropagation();
		} );
	}
	// 2回目以降表示
	{
		$( '#messagebox' ).css( 'visibility', 'visible' );
	}

	MessageUpdate();
}

////////////////////////////////////////////////////////////////////////////////
// API呼び出しエラー
////////////////////////////////////////////////////////////////////////////////
function ApiError( res )
{
	if ( res.responseJSON )
	{
		MessageBox( res.url + '<br>' + 'status: ' + res.status + '<br>' + res.responseJSON.error );
	}
	else
	{
		MessageBox( res.url + '<br>' + 'status: ' + res.status + '<br>' + res.statusText );
	}
}


////////////////////////////////////////////////////////////////////////////////
// 外部通信
////////////////////////////////////////////////////////////////////////////////
function SendRequest( req, callback )
{
	switch ( req.action )
	{
		// アプリ登録
		// req : instance
		case 'register_app':
			$.ajax( {
				url: 'https://' + req.instance + '/api/v1/apps',
				dataType: 'json',
				type: 'POST',
				data: {
					client_name: manifest.name,
					redirect_uris: 'urn:ietf:wg:oauth:2.0:oob',
					scopes: 'read write follow',
					website: 'https://github.com/oken1/kurotodon',
				}
			} ).done( function( data ) {
				callback( data );
			} ).fail( function( data ) {
				callback( data );
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
				callback( data );
			} ).fail( function( data ) {
				callback( data );
			} );

			break;
	
		case 'api_call':
			var query = '';

			if ( req.method == 'GET' && req.param )
			{
				for ( var i in req.param )
				{
					query += i + '=' + req.param[i] + '&';
				}
			}

			var url = 'https://' + req.instance + '/api/v1/' + req.api;
			
			if ( query.length )
			{
				url += '?' + query

				url = url.replace( /&$/, '' );
			}

			console.log( url );

			$.ajax( {
				url: url,
				dataType: 'json',
				type: req.method,
				data: ( req.method == 'POST' || req.method == 'PATCH' ) ? req.param : {},
				headers: {
					'Authorization': 'Bearer ' + req.access_token
				}
			} ).done( function( data, txt, xhr ) {
				// parse link header
				var link = xhr.getResponseHeader( 'LINK' );

				if ( link )
				{
					if ( link.match( /max_id=(\d+)/ ) )
					{
						data.max_id = RegExp.$1;
					}

					if ( link.match( /since_id=(\d+)/ ) )
					{
						data.since_id = RegExp.$1;
					}
				}

				console.log( data );

				callback( data );
			} ).fail( function( data ) {
				data.url = url;
				callback( data );
			} );

			break;
		// mediaアップロード
		// req : instance
		//       access_token
		//       data
		case 'media_upload':
			var url = 'https://' + req.instance + '/api/v1/media';

			var fd = new FormData();

			fd.append( 'file', req.uploadFile );

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
				callback( data );
			} ).fail( function( data ) {
				data.url = url;
				callback( data );
			} );

			break;
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

				callback( res );
			} ).fail( function( data ) {
				callback( res );
			} );

			break;
		default:
			break;
	}
}

////////////////////////////////////////////////////////////////////////////////
// ツールバーユーザ？
////////////////////////////////////////////////////////////////////////////////
function IsToolbarUser( account_id, id, instance )
{
	var len = g_cmn.toolbar_user.length;

	for ( var i = 0 ; i < len ; i++ )
	{
		if ( g_cmn.toolbar_user[i].account_id == account_id &&
			 g_cmn.toolbar_user[i].id == id && g_cmn.toolbar_user[i].instance == instance )
		{
			return i;
		}
	}

	return -1;
}


////////////////////////////////////////////////////////////////////////////////
// ツールバーユーザの表示を更新
////////////////////////////////////////////////////////////////////////////////
function UpdateToolbarUser()
{
	var s = '';
	var len = g_cmn.toolbar_user.length;
	var assign;

	for ( var i = 0 ; i < len ; i++ )
	{
		assign = {
			account_id: g_cmn.toolbar_user[i].account_id,
			created_at: g_cmn.toolbar_user[i].created_at,
			avatar: g_cmn.toolbar_user[i].avatar,
			display_name: g_cmn.toolbar_user[i].display_name,
			username: g_cmn.toolbar_user[i].username,
			display_name_disp: ConvertDisplayName( g_cmn.toolbar_user[i].display_name, g_cmn.toolbar_user[i].username ),
			id: g_cmn.toolbar_user[i].id,
			instance: g_cmn.toolbar_user[i].instance,
			type: g_cmn.toolbar_user[i].type,
			drag_id: GetUniqueID(),
		};

		s += OutputTPL( 'header_user', assign );
	}

	s += "<div class='dmy'></div>";

	$( '#head_users' ).html( s ).find( '> div' ).each( function() {
		if ( $( this ).hasClass( 'dmy' ) )
		{
			return true;
		}

		var account_id = $( this ).attr( 'account_id' );
		var id = $( this ).attr( 'id' );
		var username = $( this ).attr( 'username' );
		var display_name = $( this ).attr( 'display_name' );
		var instance = $( this ).attr( 'instance' );
		var type = $( this ).attr( 'type' );

		////////////////////////////////////////////////////////////
		// アイコンクリック時処理
		////////////////////////////////////////////////////////////
		$( this ).find( 'img' ).click( function( e ) {
			switch ( type )
			{
				case 'user':
					OpenUserTimeline( account_id, id, username, display_name, instance );
					break;
			}

			e.stopPropagation();
		} )
		////////////////////////////////////////////////////////////
		// 削除処理
		////////////////////////////////////////////////////////////
		.on( 'contextmenu', function( e ) {
			var index = IsToolbarUser( account_id, id, instance );

			if ( index != -1 )
			{
				g_cmn.toolbar_user.splice( index, 1 );
				UpdateToolbarUser();
				$( '#tooltip' ).hide();
			}

			return false;
		} )
		.on( 'mouseenter mouseleave', function( e ) {
			if ( e.type == 'mouseenter' )
			{
				SetDraggable( $( this ), null, null );
			}
			else
			{
				$( '#tooltip' ).hide();
			}
		} );
	} );
}


////////////////////////////////////////////////////////////////////////////////
// セーブデータをテキスト化する
////////////////////////////////////////////////////////////////////////////////
function SaveDataText()
{
	var _g_cmn = {};
	var pi;

	for ( var i in g_cmn )
	{
		if ( i == 'notsave' )
		{
			continue;
		}
		else if ( i == 'account' )
		{
			_g_cmn[i] = {};

			for ( var j in g_cmn[i] )
			{
				_g_cmn[i][j] = {};

				for ( var k in g_cmn[i][j] )
				{
					if ( k == 'notsave' )
					{
						continue;
					}
					else
					{
						_g_cmn[i][j][k] = g_cmn[i][j][k];
					}
				}
			}
		}
		else if ( i == 'panel' )
		{
			_g_cmn[i] = new Array();

			for ( var j = 0, _len = g_cmn[i].length ; j < _len ; j++ )
			{
				_g_cmn[i].push( {} );

				for ( var k in g_cmn[i][j] )
				{
					if ( k != 'contents' && k != 'SetType' && k != 'SetTitle' && k != 'SetIcon' &&
						 k != 'SetParam' && k != 'SetContents' )
					{
						_g_cmn[i][j][k] = g_cmn[i][j][k];
					}
				}

				pi = $( '#' + g_cmn[i][j].id );

				_g_cmn[i][j].x = pi.position().left;
				_g_cmn[i][j].y = pi.position().top;
				_g_cmn[i][j].w = pi.outerWidth();
				_g_cmn[i][j].h = pi.outerHeight();
				_g_cmn[i][j].zindex = pi[0].style.zIndex;
			}
		}
		else
		{
			_g_cmn[i] = g_cmn[i];
		}
	}

	// 共通データをJSON形式でlocalStorageに保存
	var text = JSON.stringify( _g_cmn );
	text = encodeURIComponent( text );

	return text;
}


////////////////////////////////////////////////////////////////////////////////
// 画面リサイズ
////////////////////////////////////////////////////////////////////////////////
$( window ).on( 'resize', function( e ) {
	$( '#head' ).css( { width: $( window ).width() } );
} );


////////////////////////////////////////////////////////////////////////////////
// パネルリストの更新
////////////////////////////////////////////////////////////////////////////////
$( document ).on( 'panellist_changed', function( e ) {
	var items = new Array();

	var _p, _class, icon, badge;

	for ( var i = 0, _len = g_cmn.panel.length ; i < _len ; i++ )
	{
		_p = $( '#' + g_cmn.panel[i].id );
		_class = _p.find( 'span.titleicon' ).attr( 'class' );
		icon = '';
		badge = '';

		// アイコンあり
		if ( _class.match( /(icon-\S*)/ ) )
		{
			var _icon = RegExp.$1;

			if ( _p.find( 'span.titleicon' ).css( 'display' ) != 'none' )
			{
				icon = _icon;
			}
		}

		// 未読あり
		var _b = _p.find( '> div.titlebar' ).find( 'span.badge' );
		if ( _b )
		{
			badge = _b.text();
		}

		items.push( {
			icon: icon,
			title: twemoji.parse( g_cmn.panel[i].title ),
			panel_id: g_cmn.panel[i].id,
			badge: badge
		} );
	}

	$( '#panellist' ).find( '> div.lists' ).html( OutputTPL( 'panellist', { items: items } ) )
	.find( 'span.badge' ).each( function() {
		if ( $( this ).text() != '' )
		{
			$( this ).show();
		}
		else
		{
			$( this ).hide();
		}
	} )
	.end().find( '> div' ).on( 'click', function() {
		var panel_id = $( this ).attr( 'panel_id' );
		var _p = $( '#' + panel_id );
		SetFront( _p );

		$( 'body' ).animate( { scrollTop: _p.position().top - $( '#head' ).outerHeight(),  scrollLeft: _p.position().left }, 200 );
	} );
} );


var g_message_data = null;

function SetLocaleFile()
{
	$.ajax( {
		url: '_locales/' + g_cmn.cmn_param.locale + '/messages.json',
		dataType: 'json',
		type: 'GET',
		async: false,
	} ).done( function( data ) {
		g_message_data = data;
	} ).fail( function( data ) {
		g_message_data = null;
	} );
}

////////////////////////////////////////////////////////////////////////////////
// 言語選択対応i18n.getMessageもどき
////////////////////////////////////////////////////////////////////////////////
function i18nGetMessage( id, options )
{
	if ( g_message_data != null )
	{
		if ( g_message_data[id] )
		{
			if ( g_message_data[id].placeholders )
			{
				var cnt = 0;
				var msg = g_message_data[id].message;

				for ( var p in g_message_data[id].placeholders )
				{
					if ( cnt < options.length )
					{
						msg = msg.replace( '$' + p + '$', options[cnt] );
					}
					else
					{
						msg = msg.replace( '$' + p + '$', '' );
					}

					cnt++;
				}

				if ( msg == '' )
				{
					console.log( 'i18nGetMessage error [' + id + ']' );
				}
				
				return msg;
			}
			else
			{
				if ( g_message_data[id].message == '' )
				{
					console.log( 'i18nGetMessage error [' + id + ']' );
				}
				
				return g_message_data[id].message;
			}
		}
	}
	else
	{
		return '';
	}
}


////////////////////////////////////////////////////////////////////////////////
// Tootのタグを表示用に変換する
////////////////////////////////////////////////////////////////////////////////
function ConvertContent( content, json )
{
	// カスタム絵文字（仮）
	if ( json.emojis )
	{
		for ( var i = 0 ; i < json.emojis.length ; i++ )
		{
			var shortcode = ':' + json.emojis[i].shortcode + ':';
			content = content.replace( new RegExp( shortcode, 'g' ),
						'<img class="emoji" alt="' + shortcode + '" title="' + shortcode + '" src="' + json.emojis[i].url + '">' );
		}
	}

	// friends.nicoのユーザープロフィール絵文字（仮）
	if ( json.profile_emojis )
	{
		for ( var i = 0 ; i < json.profile_emojis.length ; i++ )
		{
			var shortcode = ':@' + json.profile_emojis[i].shortcode + ':';
			content = content.replace( new RegExp( shortcode, 'g' ),
						'<img class="emoji" alt="' + shortcode + '" title="' + shortcode + '" src="' + json.profile_emojis[i].url + '">' );
		}
	}

	var _jq = $( '<div>' + content + '</div>' );

	// @userを置き換える
	for ( var i = 0 ; i < json.mentions.length ; i++ )
	{
		_jq.find( 'a[href="' + json.mentions[i].url + '"]' ).each( function( e ) {
			var anchor = $( this );

			$( this ).unwrap();

			var _user = $( '<span class="user anchor">@' + anchor.find( 'span' ).text() + '</span>' );

			_user.attr( {
				'id': json.mentions[i].id,
				'username': json.mentions[i].username,
				'acct': json.mentions[i].acct
			} );

			$( this ).replaceWith( _user );
		} )
	}

	// mediaをサムネイルに置き換える
	var _thumbnails = $( '<div class="thumbnails" urls="" types="">' );
	var _index = 0;
	var _urls = [];
	var _types = [];
	
	_thumbnails.html( OutputTPL( 'thumbnail', {} ) );

	for ( var i = 0 ; i < json.media_attachments.length ; i++ )
	{
		if ( json.media_attachments[i].url == '/files/original/missing.png' )
		{
			continue;
		}
		
		if ( json.media_attachments[i].text_url != null )
		{
			_jq.find( 'a[href="' + json.media_attachments[i].text_url + '"]' ).each( function( e ) {
				$( this ).remove();
			} );
		}

		var _img = $( '<img class="thumbnail ' + json.media_attachments[i].type + '" src="' + json.media_attachments[i].preview_url + '" index="' + _index + '">' );

		_urls[_index] = json.media_attachments[i].url;
		_types[_index] = json.media_attachments[i].type;
		_index++;

		_thumbnails.find( '.images' ).append( _img );
	}

	if ( json.sensitive )
	{
		_thumbnails.find( '.nsfw_change' ).show();
		_thumbnails.find( '.images' ).hide();
	}
	else
	{
		_thumbnails.find( '.nsfw_change' ).hide();
		_thumbnails.find( '.images' ).show();
	}

	// #hashtagを置き換える
	for ( var i = 0 ; i < json.tags.length ; i++ )
	{
		_jq.find( 'a' ).each( function( e ) {
			if ( $( this ).find( 'span' ).text().toLowerCase() == json.tags[i].name.toLowerCase() )
			{
				$( this ).replaceWith( '<span class="hashtag anchor">#' + $( this ).find( 'span' ).text() + '</span>' );
			}
		} );
	}

	var youtubes = 0;

	// その他
	_jq.find( 'a' ).each( function( e ) {
		var anchor = $( this );

		var ellipsis = '';
		var display_url = '';

		if ( anchor.find( 'span.invisible' ).length && anchor.find( 'span.ellipsis' ).length )
		{
			if ( anchor.find( 'span.invisible' ).length == 2 && anchor.find( 'span.invisible' ).last().text() != '' )
			{
				ellipsis = '…';
			}

			display_url = anchor.find( 'span.ellipsis' ).text();
		}
		else
		{
			display_url = anchor.text();
		}

		// youtube
		if ( anchor.attr( 'href' ).match( /^https?:\/\/(?:(?:www|m)\.youtube\.com\/watch\?.*v=|youtu\.be\/)([\w-]+)/ ) )
		{
			var id = RegExp.$1;

			youtubes++;
			_urls[_index] = anchor.attr( 'href' );
			_types[_index] = 'youtube';

			var _img = $( '<img class="thumbnail video" src="http://i.ytimg.com/vi/' + id + '/default.jpg' + '" index="' + _index + '">' );
			_thumbnails.find( '.images' ).append( _img );

			_index++;

		}

		$( this ).replaceWith( $( '<a href="' + anchor.attr( 'href' ) + 
			'" rel="nofollow noopener noreferrer" target="_blank" class="url anchor">' + 
			display_url + ellipsis + '</span></a>' ) );
	} );

	if ( json.media_attachments.length + youtubes )
	{
		_thumbnails.attr( 'urls', _urls.join( '\n' ) );
		_thumbnails.attr( 'types', _types.join( '\n' ) );
		_jq.append( _thumbnails );
	}

	return _jq.html();
}


////////////////////////////////////////////////////////////////////////////////
// acctからインスタンス名を取得する
////////////////////////////////////////////////////////////////////////////////
function GetInstanceFromAcct( acct, instance ) {
	var _data = acct.split( /@/ );

	if ( _data.length <= 1 )
	{
		return instance;
	}
	else
	{
		return _data[_data.length - 1];
	}
}


////////////////////////////////////////////////////////////////////////////////
// missing.png対応
////////////////////////////////////////////////////////////////////////////////
function ImageURLConvert( imgurl, acct, instance )
{
	if ( imgurl.match( /^https:\/\// ) )
	{
		return imgurl;
	}

	if ( imgurl.match( /missing.png$/ ) )
	{
		return 'https://' + GetInstanceFromAcct( acct, instance ) + imgurl;
	}
	else
	{
		return imgurl;
	}
}


////////////////////////////////////////////////////////////////////////////////
// ユーザータイムライン表示
////////////////////////////////////////////////////////////////////////////////
function OpenUserTimeline( account_id, id, username, display_name, instance )
{
	var dupchk = DuplicateCheck( {
		type: 'timeline',
		param: {
			account_id: account_id,
			timeline_type: 'user',
			id: id,
			instance: instance
		}
	} );

	if ( dupchk == -1 )
	{
		var _cp = new CPanel( null, null, g_defwidth, g_defheight_l );
		_cp.SetType( 'timeline' );

		_cp.SetParam( {
			account_id: account_id,
			timeline_type: 'user',
			id: id,
			username: username,
			display_name: display_name,
			instance: instance,
			reload_time: g_cmn.cmn_param['reload_time'],
			streaming: false,
		} );
		_cp.Start();
	}
}


////////////////////////////////////////////////////////////////////////////////
// ハッシュタグ検索結果表示
////////////////////////////////////////////////////////////////////////////////
function OpenHashtagTimeline( account_id, hashtag )
{
	var dupchk = DuplicateCheck( {
		type: 'timeline',
		param: {
			account_id: account_id,
			timeline_type: 'hashtag',
			hashtag: hashtag.replace( /^#/, '' ),
		}
	} );

	if ( dupchk == -1 )
	{
		var _cp = new CPanel( null, null, g_defwidth, g_defheight_l );
		_cp.SetType( 'timeline' );

		_cp.SetParam( {
			account_id: account_id,
			timeline_type: 'hashtag',
			hashtag: hashtag.replace( /^#/, '' ),
			reload_time: g_cmn.cmn_param['reload_time'],
			streaming: true,
		} );
		_cp.Start();
	}
}


////////////////////////////////////////////////////////////////////////////////
// プロフィール表示
////////////////////////////////////////////////////////////////////////////////
function OpenUserProfile( id, instance, account_id )
{
	var dupchk = DuplicateCheck( {
		type: 'profile',
		param: {
			account_id: account_id,
			id: id,
			instance: instance
		}
	} );

	if ( dupchk == -1 )
	{
		var _cp = new CPanel( null, null, g_defwidth, g_defheight );
		_cp.SetType( 'profile' );

		_cp.SetParam( {
			id: id,
			instance: instance,
			account_id: account_id
		} );
		_cp.Start();
	}
}


////////////////////////////////////////////////////////////////////////////////
// display_nameを表示用に変換
////////////////////////////////////////////////////////////////////////////////
function ConvertDisplayName( display_name, username )
{
	if ( display_name )
	{
		return twemoji.parse( escapeHTML( display_name ) );
	}
	else
	{
		return username;
	}
}

var loading_queue = {};

////////////////////////////////////////////////////////////////////////////////
// トゥート数表示の更新
////////////////////////////////////////////////////////////////////////////////
function StatusesCountUpdate( account_id, num )
{
	g_cmn.account[account_id].notsave.statuses_count += num;

	var pid = IsUnique( 'account' );

	// アカウントパネルを開いている場合のみ
	if ( pid != null )
	{
		$( '#' + pid ).find( 'div.contents' ).trigger( 'account_update' );
	}
}


////////////////////////////////////////////////////////////////////////////////
// 重複パネルチェック
////////////////////////////////////////////////////////////////////////////////
function DuplicateCheck( cp )
{
	var dupchk = -1;

	for ( var i = 0 ; i < g_cmn.panel.length ; i++ )
	{
		if ( g_cmn.panel[i].type == cp.type && cp.type == 'timeline' )
		{
			if ( g_cmn.panel[i].param.timeline_type == cp.param.timeline_type &&
				 g_cmn.panel[i].param.account_id == cp.param.account_id )
			{
				switch ( cp.param.timeline_type )
				{
					case 'home':
					case 'favourites':
					case 'local':
					case 'federated':
					case 'media':
					case 'notifications':
						dupchk = i;

						break;
					case 'user':
						if ( g_cmn.panel[i].param.id == cp.param.id &&
							 g_cmn.panel[i].param.instance == cp.param.instance )
						{
							dupchk = i;
						}

						break;
					case 'hashtag':
						if ( g_cmn.panel[i].param.hashtag == cp.param.hashtag )
						{
							dupchk = i;
						}

						break;
					case 'expand':
						if ( g_cmn.panel[i].param.id == cp.param.id )
						{
							dupchk = i;
						}
						
						break;
				}
			}
		}
		else if ( g_cmn.panel[i].type == cp.type && cp.type == 'profile' )
		{
			if ( g_cmn.panel[i].param.account_id == cp.param.account_id &&
				 g_cmn.panel[i].param.id == cp.param.id &&
				 g_cmn.panel[i].param.instance == cp.param.instance )
			{
				dupchk = i;
				break;
			}
		}
		else if ( g_cmn.panel[i].type == cp.type && cp.type == 'users' )
		{
			if ( g_cmn.panel[i].param.users_type == cp.param.users_type &&
				 g_cmn.panel[i].param.account_id == cp.param.account_id )
			{
				switch ( cp.param.users_type )
				{
					case 'follows':
					case 'followers':
						if ( g_cmn.panel[i].param.id == cp.param.id &&
							 g_cmn.panel[i].param.instance == cp.param.instance )
						{
							dupchk = i;
						}
						
						break;
					case 'muteusers':
					case 'blockusers':
						dupchk = i;
						
						break;
				}
			}
		}
	}

	if ( dupchk > -1 )
	{
		SetFront( $( '#' + g_cmn.panel[dupchk].id ) );
	}
	
	return dupchk;
}

////////////////////////////////////////////////////////////////////////////////
// Loading
////////////////////////////////////////////////////////////////////////////////
var loading_queue = {};

function Loading( flg, id )
{
	if ( flg == false )
	{
		delete loading_queue[id];

		if ( Object.keys( loading_queue ).length == 0 )
		{
			$( '#loading' ).hide();
		}
	}
	else
	{
		$( '#loading' ).show();
		loading_queue[id] = true;
	}
}

////////////////////////////////////////////////////////////////////////////////
// 開始
////////////////////////////////////////////////////////////////////////////////
$( document ).ready( function() {
	Init();
} );
