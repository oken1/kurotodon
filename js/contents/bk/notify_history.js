"use strict";

////////////////////////////////////////////////////////////////////////////////
// デスクトップ通知履歴
////////////////////////////////////////////////////////////////////////////////
Contents.notify_history = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var notify_history_list;
	var scrollPos = null;

	cp.SetIcon( 'icon-bubble' );

	////////////////////////////////////////////////////////////
	// リスト部作成
	////////////////////////////////////////////////////////////
	var ListMake = function( type ) {
		var s = '';

		for ( var i = g_cmn.notsave.notify_history.length - 1 ; i >= 0 ; i-- )
		{
			var assign = {};

			for ( var arg in g_cmn.notsave.notify_history[i].data )
			{
				try {
					assign[arg] = decodeURIComponent( g_cmn.notsave.notify_history[i].data[arg] );
				}
				catch ( err )
				{
					assign[arg] = g_cmn.notsave.notify_history[i].data[arg];
				}
			}

			s += OutputTPL( 'notify_' + g_cmn.notsave.notify_history[i].type, assign );
		}

		notify_history_list.html( s )
			.scrollTop( 0 );

		notify_history_list.find( '.notify' ).each( function() {
			var account_id = $( this ).attr( 'account_id' );

			$( this ).find( '.notify_username' ).click( function( e ) {
				OpenUserTimeline( $( this ).attr( 'src' ), account_id );
				e.stopPropagation();
			} );

			$( this ).find( '.notify_dmname' ).click( function( e ) {
				var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75 );
				_cp.SetType( 'timeline' );
				_cp.SetParam( {
					account_id: account_id,
					timeline_type: 'dmrecv',
					reload_time: g_cmn.cmn_param['reload_time'],
				} );
				_cp.Start();

				e.stopPropagation();
			} );

			$( this ).find( '.notify_followname' ).click( function( e ) {
				var _cp = new CPanel( null, null, 320, 360 );
				var num = $( this ).attr( 'num' );

				_cp.SetType( 'follow' );
				_cp.SetParam( {
					type: 'followers',
					account_id: account_id,
					screen_name: g_cmn.account[account_id].screen_name,
					number: num,
				} );
				_cp.Start();

				e.stopPropagation();
			} );

			$( this ).find( '.notify_listname' ).click( function( e ) {
				var _cp = new CPanel( null, null, 360, $( window ).height() * 0.75 );

				_cp.SetType( 'timeline' );
				_cp.SetParam( {
					account_id: account_id,
					timeline_type: 'list',
					list_id: $( this ).attr( 'list_id' ),
					screen_name: $( this ).attr( 'screen_name' ),
					slug: $( this ).attr( 'slug' ),
					reload_time: g_cmn.cmn_param['reload_time'],
				} );
				_cp.Start();

				e.stopPropagation();
			} );
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
					scrollPos = notify_history_list.scrollTop();
				}
			}
			// 復元
			else
			{
				if ( scrollPos != null )
				{
					notify_history_list.scrollTop( scrollPos );
					scrollPos = null;
				}
			}
		} );

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#notify_history_list' ).height( cont.height() - cont.find( '.panel_btns' ).height() - 1 );
		} );

		// 全体を作成
		cont.addClass( 'notify_history' )
			.html( OutputTPL( 'notify_history', {} ) );

		notify_history_list = $( '#notify_history_list' );

		////////////////////////////////////////
		// 更新ボタンクリック
		////////////////////////////////////////
		$( '#notify_history_reload' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			ListMake();
		} );

		// リスト部作成処理
		ListMake();
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
