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
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.addClass( 'searchbox' )
			.html( OutputTPL( 'searchbox', {} ) );

		cp.SetTitle( i18nGetMessage( 'i18n_0206' ), false );

		$( '#searchbox_box' ).find( '.btn' ).addClass( 'disabled' );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#searchbox_result' ).height( cont.outerHeight() - $( '#searchbox_box' ).outerHeight() - cont.find( '.account_select' ).outerHeight() );
		} );

		cont.trigger( 'contents_resize' );

		////////////////////////////////////////
		// アカウント選択変更
		////////////////////////////////////////
		cont.on( 'account_changed', function() {
			$( '#searchbox_result > .users_list' ).html( '' );
			$( '#searchbox_result > .hashtags_list' ).html( '' );
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

			Loading( true, 'search' );

			SendRequest(
				{
					method: 'GET',
					action: 'api_call',
					instance: g_cmn.account[cp.param.account_id].instance,
					access_token: g_cmn.account[cp.param.account_id].access_token,
					api: 'search',
					param: {
						q: $( '#searchbox_text' ).val(),
					}
				},
				function( res )
				{
					if ( res.status === undefined )
					{
						var items = [];

						for ( var i = 0 ; i < res.accounts.length ; i++ )
						{
							var instance = GetInstanceFromAcct( res.accounts[i].acct, g_cmn.account[cp.param.account_id].instance );
							
							items.push( {
								avatar: ImageURLConvert( res.accounts[i].avatar, res.accounts[i].acct, g_cmn.account[cp.param.account_id].instance ),
								display_name: ( res.accounts[i].display_name ) ? res.accounts[i].display_name : res.accounts[i].username,
								username: res.accounts[i].username,
								instance: instance,
								id: res.accounts[i].id,
								statuses_count: NumFormat( res.accounts[i].statuses_count ),
								following_count: NumFormat( res.accounts[i].following_count ),
								followers_count: NumFormat( res.accounts[i].followers_count ),
								created_at: res.accounts[i].created_at,
								users_type: 'search',
							} );
						}

						$( '#searchbox_result .users_list' ).html( OutputTPL( 'users_list', { items: items } ) );

						for ( var i = 0, items = [] ; i < res.hashtags.length ; i++ )
						{
							items.push( {
								hashtag: res.hashtags[i]
							} );
						}

						$( '#searchbox_result .hashtags_list' ).html( OutputTPL( 'hashtags_list', { items: items } ) );

						var _p = p.outerHeight();
						var _h = p.find( '.titlebar' ).outerHeight() + p.find( '.account_select' ).outerHeight() +
								 cont.find( '#searchbox_box' ).outerHeight() + $( '#searchbox_result .users_list' ).outerHeight() +
								 $( '#searchbox_result .hashtags_list' ).outerHeight() + parseInt( p.css( 'border-top-width' ) ) * 2;

						p.css( { height: Math.min( _h, $( window ).height() * 0.75 ) } );
						cont.css( { height: cont.outerHeight() + p.outerHeight() - _p } );
						cont.trigger( 'contents_resize' );
					}
					else
					{
						ApiError( res );
					}
					
					Loading( false, 'search' );
				}
			);

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
		// Enterで検索実行
		////////////////////////////////////////
		$( '#searchbox_text' ).keypress( function( e ) {
			if ( e.keyCode == 13 )
			{
				$( '#search' ).trigger( 'click' );
			}
		} );

		////////////////////////////////////////
		// ユーザ名クリック
		////////////////////////////////////////
		cont.find( '.users_list' ).on( 'click', '> div.item .display_name, > div.item .username', function( e ) {
			var item = $( this ).closest( '.item' );

			OpenUserTimeline( cp.param.account_id, item.attr( 'id' ), item.attr( 'username' ),
				item.attr( 'display_name' ), item.attr( 'instance' ) );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンクリック
		////////////////////////////////////////
		cont.find( '.users_list' ).on( 'click', '> div.item .avatar', function( e ) {
			var item = $( this ).closest( '.item' );

			OpenUserProfile( item.attr( 'id' ), item.attr( 'instance' ), cp.param.account_id );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// ハッシュタグクリック
		////////////////////////////////////////
		cont.find( '.hashtags_list' ).on( 'click', '> div.item .hashtag', function( e ) {
			OpenHashtagTimeline( cp.param.account_id, $( this ).find( '> span' ).text() );

			e.stopPropagation();
		} );

		////////////////////////////////////////
		// アイコンにカーソルを乗せたとき
		////////////////////////////////////////
		cont.find( '.users_list' ).on( 'mouseenter mouseleave', '> div.item div.avatar > img', function( e ) {
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
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
