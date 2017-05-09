"use strict";

////////////////////////////////////////////////////////////////////////////////
// トゥート
////////////////////////////////////////////////////////////////////////////////
Contents.tootbox = function( cp )
{
	var p = $( '#' + cp.id );
	var cont = p.find( 'div.contents' );
	var uploading = 0;

	cp.SetIcon( 'icon-pencil' );

	////////////////////////////////////////////////////////////
	// 開始処理
	////////////////////////////////////////////////////////////
	this.start = function() {
		cont.addClass( 'tootbox' )
			.html( OutputTPL( 'tootbox' ) );

		// トゥートボタンのツールチップを設定に合わせる
		var _tips = new Array( 'Ctrl+Enter', 'Shift+Enter', 'Enter' );
		cont.find( '.toot' ).attr( 'tooltip', i18nGetMessage( 'i18n_0367' ) + '(' + _tips[g_cmn.cmn_param.tootkey] + ')' );

		////////////////////////////////////////
		// ファイルドロップ時の処理
		////////////////////////////////////////
		cont.on( 'drop',
			function( e ) {
				// データなし
				if ( !e.originalEvent.dataTransfer )
				{
					return;
				}

				// テキスト
				if ( e.originalEvent.dataTransfer.getData( 'text' ) )
				{
					return;
				}

				e.preventDefault();

				// ファイル
				var _index = 0;
				var _len = e.originalEvent.dataTransfer.files.length;
				var _files = e.originalEvent.dataTransfer.files;

				var WaitUpload = function() {
					if ( uploading > 0 )
					{
						setTimeout( WaitUpload, 100 );
					}
					else
					{
						if ( cont.find( '.imageattach' ).hasClass( 'disabled' ) )
						{
							return false;
						}

						if ( _index < _len )
						{
							AppendAttachFile( _files[_index] );
							_index++;
							setTimeout( WaitUpload, 100 );
						}
					}
				};

				WaitUpload();
			}
		);

		////////////////////////////////////////
		// 添付画像削除ボタンクリック処理
		////////////////////////////////////////
		var ImageDelClick = function() {
			// アップロード中は削除できないようにする
			if ( twflg )
			{
				return;
			}

			var index = cont.find( '.tootimages' ).find( '.del' ).find( 'span' ).index( this );

			var imageitem = $( this ).parent().parent();
			var height = imageitem.outerHeight( true );

			// テキスト内からURLを削除する
			var r = new RegExp( ' ?' + imageitem.attr( 'text_url' ) );
			cont.find( '.text' ).val( cont.find( '.text' ).val().replace( r, '' ) );

			imageitem.remove();

			if ( cont.find( '.tootimages' ).find( '.imageitem' ).length == 0 )
			{
				cont.height( cont.height() - height );
				p.height( p.height() - height );
			}

			ImageFileReset();
			cont.find( '.text' ).trigger( 'keyup' );

			// 画像添付ボタンのdisabled解除
			cont.find( '.imageattach' ).removeClass( 'disabled' );
		};

		////////////////////////////////////////
		// fileの初期化
		////////////////////////////////////////
		var ImageFileReset = function() {
			var imgp = cont.find( '.imageattach_input' ).parent();
			var ohtml = imgp.html();
			cont.find( '.imageattach_input' ).remove();
			imgp.html( ohtml );

			cont.find( '.imageattach_input' ).change( ImageAttachChange );
		};

		////////////////////////////////////////
		// ファイル選択変更時の処理
		////////////////////////////////////////
		var ImageAttachChange = function() {
			if ( cont.find( '.imageattach_input' )[0].files.length == 1 )
			{
				AppendAttachFile( cont.find( '.imageattach_input' )[0].files[0] );
			}
		};

		////////////////////////////////////////
		// 添付画像を追加
		////////////////////////////////////////
		var AppendAttachFile = function( f ) {
			var tootimages = cont.find( '.tootimages' );
			var _itemcnt = tootimages.find( '.imageitem' ).length;

			if ( f.type.match( 'image.*' ) || f.type.match( 'video.*' ) )
			{
				chrome.extension.getBackgroundPage().uploadFile = f;

				Blackout( true );
				$( '#account_list' ).activity( { color: '#ffffff' } );

				uploading++;

				SendRequest(
					{
						action: 'media_upload',
						instance: g_cmn.account[cp.param['account_id']].instance,
						access_token: g_cmn.account[cp.param['account_id']].access_token,
					},
					function( res )
					{
						uploading--;

						if ( res.status === undefined )
						{
							tootimages.append( OutputTPL( 'tootbox_image', { item: res } ) );
							tootimages.attr( 'account_id', cp.param['account_id'] );
							tootimages.find( '.del:last' ).find( 'span' ).click( ImageDelClick );
							tootimages.find( '.imageitem:last' ).attr( 'uid', GetUniqueID() );

							tootimages.find( '.imageitem:last > .icon > img' ).attr( 'src', res.preview_url );
							cont.find( '.text' ).val( cont.find( '.text' ).val() + ' ' + res.text_url );

							var height = tootimages.find( '.imageitem:last' ).outerHeight( true );

							if ( _itemcnt == 0 )
							{
								cont.height( cont.height() + height );
								p.height( p.height() + height );
							}

							if ( tootimages.find( '.imageitem' ).length == 4 )
							{
								cont.find( '.imageattach' ).addClass( 'disabled' );
							}
						}
						else
						{
							ApiError( res );
						}
						
						$( '#account_list' ).activity( false );
						Blackout( false );
					}
				);
			};

			ImageFileReset();
			cont.find( '.text' ).trigger( 'keyup' );
		};

		cont.find( '.text' ).focus();

		////////////////////////////////////////
		// リサイズ処理
		////////////////////////////////////////
		cont.on( 'contents_resize', function() {
			var acc_h = cont.find( '.account_select' ).outerHeight();
			var opt_h = cont.find( '.tootimages' ).outerHeight();
			var btn_h = cont.find( '.cnt_buttons' ).outerHeight();
			var padd = parseInt( cont.find( '.tootbox_box' ).css( 'padding-top' ) );

			cont.find( '.tootbox_box' ).css( 'height', cont.outerHeight() - acc_h - opt_h );
			cont.find( '.text' ).css( 'height', cont.find( '.tootbox_box' ).outerHeight() - btn_h - padd * 2 );
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
		// アカウント変更時処理
		////////////////////////////////////////
		cont.on( 'account_changed', function() {
			// 添付画像をクリア
			if ( cp.param['account_id'] != cont.find( '.tootimages' ).attr( 'account_id' ) )
			{
				cont.find( '.tootimages' ).find( '.imageitem' ).find( '.del' ).find( 'span' ).trigger( 'click' );
			}
		} );

		////////////////////////////////////////
		// トゥートボタンクリック処理
		////////////////////////////////////////
		var twflg = false;

		cont.find( '.toot' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			// 連続投稿防止
			if ( twflg )
			{
				return;
			}

			$( this ).addClass( 'disabled' );

			var media_ids = [];

			cont.find( '.tootimages' ).find( '.imageitem' ).each( function() {
				media_ids.push( $( this ).attr( 'attachment_id' ) );
			} );

			SendRequest(
				{
					action: 'api_call',
					instance: g_cmn.account[cp.param['account_id']].instance,
					api: 'statuses',
					access_token: g_cmn.account[cp.param['account_id']].access_token,
					post: {
						status: cont.find( '.text' ).val(),
						media_ids: media_ids,
					}
				},
				function( res )
				{
					if ( res.status === undefined )
					{
						// テキストボックスを空にする
						cont.find( '.text' ).val( '' )
							.trigger( 'keyup' );

						// 添付画像をクリア
						cont.find( '.tootimages' ).find( '.imageitem' ).find( '.del' ).find( 'span' ).trigger( 'click' );

						cont.find( '.text' ).SetPos( 'start' );

						StatusesCountUpdate( cp.param['account_id'], 1 );
					}
					else
					{
						ApiError( res );
					}

					Blackout( false, false );
					$( '#blackout' ).activity( false );
				}
			);


			e.stopPropagation();
		} );

		var tootbox_text = cont.find( '.text' );

		////////////////////////////////////////
		// 入力文字数によるボタン制御
		////////////////////////////////////////
		cont.find( '.text' ).on( 'keyup change', function( e ) {




//////// 仮 /////////////////////////////////////////////////////////////////
			var val = tootbox_text.val();
			var slen = val.length;

			var cnt = cont.find( '.cnt' );
			var btn = cont.find( '.toot' );

			cnt.html( 500 - slen );

			if ( slen > 0 && slen <= 500 && twflg == false )
			{
				btn.removeClass( 'disabled' );
			}
			else
			{
				btn.addClass( 'disabled' );
			}

			if ( 500 - slen < 0 )
			{
				cnt.addClass( 'ng' );
			}
			else
			{
				cnt.removeClass( 'ng' );
			}
		} );

		////////////////////////////////////////
		// キーボードショートカット
		////////////////////////////////////////
		cont.find( '.text' ).keydown( function( e ) {
			// Enterに設定されているときは、Ctrl+Enterで改行
			if ( g_cmn.cmn_param.tootkey == 2 && ( e.keyCode == 13 && e.ctrlKey == true ) )
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

			if ( ( g_cmn.cmn_param.tootkey == 0 && ( e.keyCode == 13 && e.ctrlKey == true ) ) ||
				 ( g_cmn.cmn_param.tootkey == 1 && ( e.keyCode == 13 && e.shiftKey == true ) ) ||
				 ( g_cmn.cmn_param.tootkey == 2 && ( e.keyCode == 13 && e.ctrlKey == false && e.shiftKey == false ) ) )
			{
				cont.find( '.toot' ).trigger( 'click' );
				return false;
			}
		} );

		////////////////////////////////////////
		// 画像を添付ボタンクリック処理
		////////////////////////////////////////
		cont.find( '.imageattach' ).click( function( e ) {
			// disabledなら処理しない
			if ( $( this ).hasClass( 'disabled' ) )
			{
				return;
			}

			cont.find( '.imageattach_input' ).click();
			e.stopPropagation();
		} );

		cont.find( '.imageattach_input' ).change( ImageAttachChange );
	};
	
	////////////////////////////////////////////////////////////
	// 終了処理
	////////////////////////////////////////////////////////////
	this.stop = function() {
		// 添付画像をクリア
		cont.find( '.tootimages' ).find( '.imageitem' ).find( '.del' ).find( 'span' ).trigger( 'click' );
	};
}
