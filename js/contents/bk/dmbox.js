"use strict";

////////////////////////////////////////////////////////////////////////////////
// DM
////////////////////////////////////////////////////////////////////////////////
Contents.dmbox = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );

	cp.SetIcon( 'icon-envelop' );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.addClass( 'dmbox' )
			.html( OutputTPL( 'dmbox', { maxlen: cp.param['maxlen'] } ) );

		$( '#dmbox_cnt' ).hide();

		// 送信ボタンのツールチップを設定に合わせる
		var _tips = new Array( 'Ctrl+Enter', 'Shift+Enter', 'Enter' );
		$( '#dmsend' ).attr( 'tooltip', chrome.i18n.getMessage( 'i18n_0250' ) + '(' + _tips[g_cmn.cmn_param.tweetkey] + ')' );

		$( '#dmbox_text' ).focus();

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			$( '#dmbox_text' ).width( p.width() - 24 );
			$( '#dmbox_box' ).find( 'div:first' ).width( p.width() - 12 );

			var acc_h = cont.find( '.account_select' ).outerHeight();

			var btn_h = $( '#dmbox_btn' ).parent().outerHeight();

			$( '#dmbox_box' ).height( cont.outerHeight() - acc_h - 12 );
			$( '#dmbox_text' ).height( $( '#dmbox_box' ).outerHeight() - btn_h - 24 );
		} );

		cont.trigger( 'contents_resize' );

		////////////////////////////////////////
		// アカウント情報更新
		////////////////////////////////////////
		cont.on( 'account_update', function() {
			// アカウントが0件の場合はパネルを閉じる
			if ( AccountCount() == 0 )
			{
				// ツイートパネルを閉じる
				p.find( '.close' ).trigger( 'click', [false] );
				return;
			}
			else
			{
				AccountSelectMake( cp );
			}
		} );

		cont.trigger( 'account_update' );

		////////////////////////////////////////
		// 送信ボタンクリック処理
		////////////////////////////////////////
		$( '#dmsend' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// 文字数チェック
			var val = dmbox_text.val();
			var urls = twttr.txt.extractUrls( val );

			for ( var i = 0, _len = urls.length ; i < _len ; i++ )
			{
				val = val.replace( urls[i], tco );
			}

			var slen = val.length;

			if ( slen > cp.param['maxlen'] )
			{
				MessageBox( chrome.i18n.getMessage( 'i18n_0356', [slen, cp.param['maxlen']] ) );
				return;
			}

			$( this ).addClass( 'disabled' );

			var data = {};
			var status = '';

			status += $( '#dmbox_text' ).val();

			var conf = confirm( chrome.i18n.getMessage( 'i18n_0150', [g_cmn.account[cp.param['account_id']]['screen_name'],cp.param['screen_name']] ) );

			if ( !conf )
			{
				$( this ).removeClass( 'disabled' );
				e.stopPropagation();
				return;
			}

			data['text'] = status;
			data['screen_name'] = cp.param['screen_name'];

			var param = {
				type: 'POST',
				url: ApiUrl( '1.1' ) + 'direct_messages/new.json',
				data: data,
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
						// テキストボックスを空にする
						$( '#dmbox_text' ).val( '' )
							.trigger( 'keyup' );

						// ツイート数表示の更新
						StatusesCountUpdate( cp.param['account_id'], 1 );
					}
					else
					{
						console.log( 'status[' + res.status + ']' );

						$( this ).removeClass( 'disabled' );

						ApiError( chrome.i18n.getMessage( 'i18n_0081' ), res );
					}

					Blackout( false, false );
					$( '#blackout' ).activity( false );
				}
			);

			e.stopPropagation();
		} );

		var dmbox_text = $( '#dmbox_text' );
		var tco = new String( '_______________________________' ).slice( 0, g_cmn.twconfig.short_url_length );

		////////////////////////////////////////
		// 入力文字数によるボタン制御
		////////////////////////////////////////
		$( '#dmbox_text' ).on( 'keyup change', function( e ) {
			var val = dmbox_text.val();

			var slen = val.length;

			var btn = $( '#dmsend' );

			if ( slen > 0 && slen <= cp.param['maxlen'] )
			{
				btn.removeClass( 'disabled' );
			}
			else
			{
				btn.addClass( 'disabled' );
			}
		} );

		////////////////////////////////////////
		// キーボードショートカット
		////////////////////////////////////////
		$( '#dmbox_text' ).keydown( function( e ) {
			// Enterに設定されているときは、Ctrl+Enterで改行
			if ( g_cmn.cmn_param.tweetkey == 2 && ( e.keyCode == 13 && e.ctrlKey == true ) )
			{
				var obj = $( this ).get( 0 );
				var spos = obj.selectionStart;
				var epos = obj.selectionEnd;
				var s = obj.value;
				var np = spos + 1;
				obj.value = s.substr( 0, spos ) + '\n' + s.substr( epos );
				obj.setSelectionRange( np, np );
				return false;
			}

			if ( ( g_cmn.cmn_param.tweetkey == 0 && ( e.keyCode == 13 && e.ctrlKey == true ) ) ||
				 ( g_cmn.cmn_param.tweetkey == 1 && ( e.keyCode == 13 && e.shiftKey == true ) ) ||
				 ( g_cmn.cmn_param.tweetkey == 2 && ( e.keyCode == 13 && e.ctrlKey == false && e.shiftKey == false ) ) )
			{
				$( '#dmsend' ).trigger( 'click' );
				return false;
			}
		} );
	};

	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
	};
}
