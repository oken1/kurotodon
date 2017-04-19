"use strict";

////////////////////////////////////////////////////////////////////////////////
// 検索
////////////////////////////////////////////////////////////////////////////////
Contents.searchbox = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-search' );

	////////////////////////////////////////////////////////////
	// プルダウンメニューを作成
	////////////////////////////////////////////////////////////
	function MakePullDown()
	{
		var s = '';

		if ( g_cmn.account[cp.param['account_id']].notsave.saved_search )
		{
			for ( var i = 0, _len = g_cmn.account[cp.param['account_id']].notsave.saved_search.length ; i < _len ; i++ )
			{
				s += '<div class="item">' + escapeHTML( g_cmn.account[cp.param['account_id']].notsave.saved_search[i] ) + '</div>';
			}
		}

		var pulldown = $( '#searchbox_box' ).find( '.pulldown' );

		pulldown.html( s );

		if ( s == '' )
		{
			pulldown.hide();
		}
	}

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.addClass( 'searchbox' )
			.html( OutputTPL( 'searchbox', {} ) );

		$( '#searchbox_box' ).find( '.btn' ).addClass( 'disabled' );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#searchbox_text' ).width( p.width() - 34 - $( '#search' ).outerWidth() - $( '#usersearch' ).outerWidth() );
			$( '#searchbox_box' ).find( '.pulldown' ).width( $( '#searchbox_text' ).width() );
		} );

		cont.trigger( 'contents_resize' );

		////////////////////////////////////////
		// アカウント選択変更
		////////////////////////////////////////
		cont.on( 'account_changed', function() {
			MakePullDown();
		} );

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
		// 検索ボタンクリック処理
		////////////////////////////////////////
		$( '#search' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// ツイートのURLの場合、そのツイートをパネルで開く
			if ( $( '#searchbox_text' ).val().match( /https:\/\/twitter\.com\/([0-9a-zA-Z_]+)\/status\/(\d+)/ ) )
			{
				var screen_name = RegExp.$1;
				var status_id = RegExp.$2;

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

			OpenSearchResult( $( '#searchbox_text' ).val(), cp.param['account_id'] );
			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ユーザ検索ボタンクリック処理
		////////////////////////////////////////
		$( '#usersearch' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			var _cp = new CPanel( null, null, 320, 300 );
			_cp.SetType( 'usersearch' );
			_cp.SetParam( {
				account_id: cp.param['account_id'],
				q: $( '#searchbox_text' ).val(),
			} );
			_cp.Start();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// 入力文字数によるボタン制御
		////////////////////////////////////////
		$( '#searchbox_text' ).on( 'keyup change', function() {
			var slen = $( this ).val().length;

			if ( slen > 0 )
			{
				$( '#searchbox_box' ).find( '.btn' ).removeClass( 'disabled' );
			}
			else
			{
				$( '#searchbox_box' ).find( '.btn' ).addClass( 'disabled' );
			}
		} );

		$( '#searchbox_text' ).focus();

		////////////////////////////////////////
		// テキストボックスクリック
		////////////////////////////////////////
		$( '#searchbox_text' ).click( function( e ) {
			var pulldown = $( this ).parent().find( '.pulldown' );

			if ( pulldown.css( 'display' ) == 'none' )
			{
				if ( pulldown.find( 'div.item' ).length )
				{
					pulldown.show();
				}
			}
			else
			{
				pulldown.hide();
			}

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// プルダウン選択
		////////////////////////////////////////
		 $( '#searchbox_box' ).find( 'div.pulldown' ).on( 'click', $( '> div.item' ).selector, function( e ) {
			$( '#searchbox_text' ).val( $( this ).text() )
				.trigger( 'keyup' )
				.focus();

			$( this ).parent().hide();

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// Enterで検索実行
		////////////////////////////////////////
		$( '#searchbox_text' ).keypress( function( e ) {
			if ( e.keyCode == 13 )
			{
				$( '#search' ).trigger( 'click' );
			}
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
