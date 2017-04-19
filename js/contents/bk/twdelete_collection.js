"use strict";

////////////////////////////////////////////////////////////////////////////////
// ツイ消しこれくしょん
////////////////////////////////////////////////////////////////////////////////
Contents.twdelete_collection = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var twdelete_collection_list;
	var scrollPos = null;

	cp.SetIcon( 'icon-zoom' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function() {
		var s = '';
		var _a;

		for ( var i = g_cmn.twdelete_history.length - 1 ; i >= 0 ; i-- )
		{
			_a = $.extend( true, {}, g_cmn.twdelete_history[i] );
			_a.rarity_name = GetRarity( _a.rarity );
			_a.index = i;
			_a.dt = DateYYYYMMDD( _a.date, 4 );

			if ( _a.time == g_cmn.twdelete.best )
			{
				_a.best = true;
			}

			_a.time = ( _a.time / 1000 <= 999 ) ? ( ( _a.time / 1000 ).toFixed( 5 ).toString() + '00000' ).substr( 0, 5 ) : ' 999+';

			s += OutputTPL( 'twdelete', _a );
		}

		twdelete_collection_list.html( s );

		twdelete_collection_list.find( '> div.twd' ).on( 'mouseenter mouseleave', function( e ) {
			if ( e.type == 'mouseenter' )
			{
				$( this ).find( 'div.twd_del' ).css( { display: 'block' } );
			}
			else
			{
				$( this ).find( 'div.twd_del' ).css( { display: 'none' } );
			}
		} )
		.find( '> div.twd_del' ).on( 'click', function( e ) {
			var twd = $( this ).parent();

			var DelCard = function( n ) {
				g_cmn.twdelete_history.splice( n, 1 );
				twd.remove();
				ListMake();
			}

			if ( twd.hasClass( 'rarity1' ) || twd.hasClass( 'rarity2' ) || twd.hasClass( 'rarity3' ) )
			{
				DelCard( $( this ).attr( 'index' ) );
			}
			else
			{
				if ( confirm( chrome.i18n.getMessage( 'i18n_0224' ) ) )
				{
					DelCard( $( this ).attr( 'index' ) );
				}
			}
		} );

		cont.trigger( 'contents_resize' );
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
					scrollPos = twdelete_collection_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					twdelete_collection_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			twdelete_collection_list.height( cont.height() - $( '#twdelete_collection_head' ).outerHeight() - 1 );
//			twdelete_collection_list.find( '.twd' ).width( twdelete_collection_list.outerWidth() / Math.min( 3, g_cmn.twdelete_history.length ) );
		} );

		// 全体を作成
		cont.addClass( 'twdelete_collection' )
			.html( OutputTPL( 'twdelete_collection', {} ) );

		// ヘッダ部作成
		$( '#twdelete_collection_head' ).html( OutputTPL( 'twdelete_collection_head', { total_exp: g_cmn.twdelete.exp, count: g_cmn.twdelete.count, best: g_cmn.twdelete.best / 1000 } ) );

		// 一括削除ダイアログ
		cont.append( OutputTPL( 'twdelete_collection_batchdialog' ) );
		$( '#twdelete_collection_batchdialog' ).css( {
			top: $( '#twdelete_collection_head' ).position().top + $( '#twdelete_collection_head' ).outerHeight(),
		} ).hide();

		$( '#twdelete_collection_head' ).find( '>span > a.batch_del' ).click( function( e ) {
			$( '#twdelete_collection_batchdialog' ).toggle();

			e.stopPropagation();
		} );

		$( '#twdelete_collection_batchdelete' ).click( function( e ) {
			if ( confirm( chrome.i18n.getMessage( 'i18n_0224' ) ) )
			{
				for ( var i = 1 ; i <= 6 ; i++ )
				{
					if ( $( '#del_rare_' + i ).prop( 'checked' ) )
					{
						var _len = g_cmn.twdelete_history.length;

						for ( var j = 0 ; j < _len ; )
						{
							if ( g_cmn.twdelete_history[j].rarity == i )
							{
								g_cmn.twdelete_history.splice( j, 1 );
								_len--;
							}
							else
							{
								j++;
							}
						}
					}
				}

				ListMake();
			}

			e.stopPropagation();
		} );

		// リスト部作成処理
		twdelete_collection_list = $( '#twdelete_collection_list' );

		ListMake();

		twdelete_collection_list.on( 'history_reload', function( e, type ) {
			ListMake();
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
