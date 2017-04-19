"use strict";

////////////////////////////////////////////////////////////////////////////////
// RSS
////////////////////////////////////////////////////////////////////////////////
Contents.rss = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var lines = cont.find( '.lines' );
	var setting = cont.find( '.setting' );
	var rss_list;
	var scrollPos = null;
	var scrollHeight = null;
	var tm = null;
	var loadcnt = 0;
	var loadhtml = [];
	var feedchange = false;

	cp.SetIcon( 'icon-feed' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function() {
		var len = cp.param['urls'].length;

		if ( loadcnt != 0 )
		{
			return;
		}

		if ( len == 0 )
		{
			rss_list.html( '' );
			return;
		}

		lines.activity( { color: '#ffffff' } );
		loadcnt = len;
		loadhtml = [];

		for ( var i = 0 ; i < len ; i++ )
		{
			SendRequest(
				{
					action: 'feed',
					url: cp.param['urls'][i].url,
					count: cp.param['count'],
					index: i,
				},
				function( res )
				{
					loadcnt--;

					if ( res.items[0].feedtitle != '' && res.items[0].feedlink != '' )
					{
						loadhtml[res.index] = OutputTPL( 'rss_list', { showdesc: cp.param['showdesc'], items: res.items } );
					}

					if ( loadcnt == 0 )
					{
						rss_list.html( loadhtml.join() );
						loadhtml = [];
						cont.trigger( 'contents_resize' );

						lines.activity( false );
					}
				}
			);
		}
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
					scrollPos = rss_list.scrollTop();
					scrollHeight = rss_list.prop( 'scrollHeight' );
				}
			}
			// 復元
			else
			{
				// タイムラインが表示されている場合のみ
				if ( scrollPos != null && scrollHeight != null &&
					 setting.css( 'display' ) == 'none' )
				{
					if ( scrollHeight != 0 )
					{
						rss_list.scrollTop( scrollPos + ( rss_list.prop( 'scrollHeight' ) - scrollHeight ) );
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
			cont.find( '.rss_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
			setting.find( '.rsssetting_items' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 全体を作成
		cont.addClass( 'rss' );
		lines.html( OutputTPL( 'rss', {} ) );
		setting.html( OutputTPL( 'rsssetting', { param: cp.param } ) );

		lines.show();
		setting.hide();

		rss_list = lines.find( '.rss_list' );

		// 設定画面初期化
		SettingInit();

		cp.SetTitle( cp.param['title'], true );

		////////////////////////////////////////
		// 新着読み込みタイマー開始
		////////////////////////////////////////
		rss_list.on( 'reload_timer', function() {
			// タイマーを止める
			if ( tm != null )
			{
				clearInterval( tm );
				tm = null;
			}

			// タイマー起動
			tm = setInterval( function() {
				ListMake();
			}, cp.param['reload_time'] * 1000 * 60 );
		} );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.rss_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			rss_list.trigger( 'reload_timer' );
			ListMake();
		} );

		////////////////////////////////////////
		// 一番上へ
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.sctbl' ).find( 'a:first' ).click( function( e ) {
			rss_list.scrollTop( 0 );
		} );

		////////////////////////////////////////
		// 一番下へ
		////////////////////////////////////////
		cont.find( '.panel_btns' ).find( '.sctbl' ).find( 'a:last' ).click( function( e ) {
			rss_list.scrollTop( rss_list.prop( 'scrollHeight' ) );
		} );

		// リスト部作成処理
		setTimeout( function() {
			ListMake();
		}, 1 );

		rss_list.trigger( 'reload_timer' );
	};

	////////////////////////////////////////
	// フィード一覧作成
	////////////////////////////////////////
	function FeedList()
	{
		setting.find( '.feed_list' ).html( OutputTPL( 'feed_list', { items: cp.param['urls'] } ) );

		////////////////////////////////////////
		// フィード削除処理
		////////////////////////////////////////
		setting.find( '.feed_list' ).find( '.del' ).click( function( e ) {
			var index = setting.find( '.feed_list' ).find( '.del' ).index( this );

			feedchange = true;
			cp.param['urls'].splice( index, 1 );
			setting.find( '.rsssetting_apply' ).removeClass( 'disabled' );
			FeedList();
		} );
	}

	////////////////////////////////////////////////////////////
	// 設定画面初期化
	////////////////////////////////////////////////////////////
	function SettingInit()
	{
		setting.find( '.rsssetting_apply' ).addClass( 'disabled' );

		setting.find( '.set_title' ).focus();

		FeedList();

		// フィード変更フラグ
		var feedchange = false;

		// 現行値設定(スライダー)
		setting.find( '.set_reload_time' ).slider( {
			min: 5,
			max: 60,
			step: 5,
			value: cp.param['reload_time'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.rsssetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_reload_time' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0272' ) );
			},
		} );

		// 現行値設定(スライダー)
		setting.find( '.set_count' ).slider( {
			min: 1,
			max: 50,
			step: 1,
			value: cp.param['count'],
			animate: 'fast',
			slide: function( e, ui ) {
				setting.find( '.rsssetting_apply' ).removeClass( 'disabled' );
				setting.find( '.set_count' ).parent().find( '.value_disp' ).html( ui.value + chrome.i18n.getMessage( 'i18n_0205' ) );
			},
		} );

		////////////////////////////////////////
		// 設定変更時処理
		////////////////////////////////////////
		setting.find( 'input[class!=set_feed]' ).on( 'change keyup', function( e ) {
			setting.find( '.rsssetting_apply' ).removeClass( 'disabled' );
		} );

		////////////////////////////////////////
		// URL入力
		////////////////////////////////////////
		setting.find( '.set_feed' ).on( 'change keyup', function( e ) {
			if ( $( this ).val().length > 0 )
			{
				setting.find( '.feed_append' ).removeClass( 'disabled' );
			}
			else
			{
				setting.find( '.feed_append' ).addClass( 'disabled' );
			}
		} );

		////////////////////////////////////////
		// 適用ボタンクリック処理
		////////////////////////////////////////
		setting.find( '.rsssetting_apply' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

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

			// 新着読み込み
			cp.param['reload_time'] = setting.find( '.set_reload_time' ).slider( 'value' );

			var _cp = {
				param: {
					count: cp.param['count'],
					showdesc: cp.param['showdesc']
				}
			};

			// 取得エントリ数
			cp.param['count'] = setting.find( '.set_count' ).slider( 'value' );

			// 説明表示
			cp.param['showdesc'] = setting.find( '.set_showdesc' ).prop( 'checked' ) ? 1 : 0;

			if ( _cp.param['count'] != cp.param['count'] || _cp.param['showdesc'] != cp.param['showdesc'] )
			{
				feedchange = true;
			}

			rss_list.trigger( 'reload_timer' );

			setting.find( '.rsssetting_apply' ).addClass( 'disabled' );

			if ( feedchange )
			{
				feedchange = false;
				ListMake();
				p.find( 'div.titlebar' ).find( '.setting' ).trigger( 'click' );
			}

			// RSSパネル管理に登録
			var _id = cp.id.replace( /^panel_/, '' );

			g_cmn.rss_panel[_id] = {
				id: _id,
				param: cp.param,
			};

			// RSSパネル一覧を表示している場合は一覧更新
			var pid = IsUnique( 'rsslist' );

			if ( pid != null )
			{
				$( '#rsslist_reload' ).trigger( 'click' );
				SetFront( p );
			}

			SaveData();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 登録ボタンクリック処理
		////////////////////////////////////////
		setting.find( '.feed_append' ).click( function( e ) {
			// disabedなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var url = setting.find( '.set_feed' ).val();

			// 登録済み？
			for ( var i = 0, _len = cp.param['urls'].length ; i < _len ; i++ )
			{
				if ( cp.param['urls'][i].url == url )
				{
					MessageBox( chrome.i18n.getMessage( 'i18n_0257' ) );
					setting.find( '.set_feed' ).focus();
					return;
				}
			}

			setting.find( '.rsssetting_items .kinditems:last' ).activity( { color: '#ffffff' } );
			setting.find( '.feed_append' ).addClass( 'disabled' );

			SendRequest(
				{
					action: 'feed',
					url: url,
					count: 1,
					index: 0,
				},
				function( res )
				{
					if ( res.items[0].feedtitle == '' || res.items[0].feedlink == '' )
					{
						MessageBox( chrome.i18n.getMessage( 'i18n_0064' ) );
						setting.find( '.set_feed' ).focus();
						setting.find( '.feed_append' ).removeClass( 'disabled' );

						setting.find( '.rsssetting_items .kinditems:last' ).activity( false );
					}
					else
					{
						feedchange = true;
						cp.param['urls'].push( { url: res.url, title: res.items[0].feedtitle } );
						setting.find( '.rsssetting_apply' ).removeClass( 'disabled' )
							.end()
							.find( '.set_feed' ).val( '' ).focus();

						// タイトル未設定の場合はフィードのタイトルを設定
						var tit = setting.find( '.set_title' );

						if ( ( tit.val() == 'RSS' || tit.val() == '' ) && res.items[0].feedtitle )
						{
							tit.val( res.items[0].feedtitle );
						}

						FeedList();

						setting.find( '.rsssetting_items .kinditems:last' ).activity( false );
					}
				}
			);

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
