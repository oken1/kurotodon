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

			if ( f.type.match( 'image.*' ) )
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
			cont.find( '.text' ).width( p.width() - 24 );
			cont.find( '.tootbox_box' ).find( 'div:first' ).width( p.width() - 12 );

			var acc_h = cont.find( '.account_select' ).outerHeight();
			var opt_h = cont.find( '.tootimages' ).outerHeight();
			var btn_h = cont.find( '.buttons' ).parent().outerHeight( true );

			cont.find( '.tootbox_box' ).height( cont.outerHeight() - acc_h - opt_h - 12 );
			cont.find( '.text' ).height( cont.find( '.tootbox_box' ).outerHeight() - btn_h - 24 );
//			cont.find( '.text' ).height( cont.outerHeight() - acc_h - opt_h - 12 - btn_h - 24 );
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
					console.log( res );
				}
			);

/*
			var data = {};
			var status = '';

			status += cont.find( '.text' ).val();

			data['status'] = status;

			var param = {
				type: 'POST',
				url: ApiUrl( '1.1' ) + 'statuses/update.json',
				data: data,
			};

			Blackout( true, false );
			$( '#blackout' ).activity( { color: '#808080', width: 8, length: 14 } );

			twflg = true;

			var TweetSend = function( media_ids ) {
				if ( media_ids )
				{
					param.data.media_ids = media_ids;
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
						twflg = false;

						if ( res.status == 200 )
						{
							// テキストボックスを空にする
							$( '#tweetbox_text' ).val( '' )
								.trigger( 'keyup' );

							// 返信情報をクリア
							$( '#tweetbox_reply' ).find( '.del' ).find( 'span' ).each( function() {
								$( this ).trigger( 'click' );
							} );

							// 添付画像をクリア
							$( '#tweetbox_image' ).find( '.del' ).find( 'span' ).each( function() {
								$( this ).trigger( 'click' );
							} );

							// ハッシュタグを自動入力
							for ( var i = 0, _len = g_cmn.hashtag.length ; i < _len ; i++ )
							{
								if ( g_cmn.hashtag[i].checked == true )
								{
									cont.trigger( 'hashset', [g_cmn.hashtag[i].hashtag] );
								}
							}

							for ( var i = 0, _len = g_cmn.notsave.tl_hashtag.length ; i < _len ; i++ )
							{
								if ( g_cmn.notsave.tl_hashtag[i].checked == true )
								{
									cont.trigger( 'hashset', [g_cmn.notsave.tl_hashtag[i].hashtag] );
								}
							}

							$( '#tweetbox_text' ).SetPos( 'start' );

							// ツイート数表示の更新
							StatusesCountUpdate( cp.param['account_id'], 1 );
						}
						else
						{
							console.log( 'status[' + res.status + ']' );

							$( this ).removeClass( 'disabled' );

							ApiError( chrome.i18n.getMessage( 'i18n_0087' ), res );
						}

						Blackout( false, false );
						$( '#blackout' ).activity( false );
					}
				);
			};
*/

/*
			// 添付画像あり
			if ( $( '#tweetbox_image' ).find( '.imageitem' ).length > 0 )
			{
				var _idx = 0;
				var media_ids = '';
				var items = $( '#tweetbox_image' ).find( '.imageitem' ).length;

				var ImageUpload = function() {
					if ( _idx == items )
					{
						TweetSend( media_ids );
						return;
					}

					var media_data =  $( '#tweetbox_image' ).find( '.imageitem' ).eq( _idx ).find( 'img' ).attr( 'src' );
					media_data = media_data.replace(/^.*,/, '');

					SendRequest(
						{
							action: 'oauth_send',
							acsToken: g_cmn.account[cp.param['account_id']]['accessToken'],
							acsSecret: g_cmn.account[cp.param['account_id']]['accessSecret'],
							param: {
								type: 'POST',
								url: ApiUrl( '1.1', 'upload' ) + 'media/upload.json',
								data: {
									media_data: media_data
								}
							}
						},
						function( res )
						{
							if ( res.status == 200 )
							{
								if ( media_ids == '' )
								{
									media_ids = res.json.media_id_string;
								}
								else
								{
									media_ids += ',' + res.json.media_id_string;
								}

								_idx++;
								ImageUpload();
							}
							else
							{
								twflg = false;

								console.log( 'status[' + res.status + ']' );

								$( this ).removeClass( 'disabled' );

								ApiError( chrome.i18n.getMessage( 'i18n_0087' ), res );

								Blackout( false, false );
								$( '#blackout' ).activity( false );
							}
						}
					);

				}
				ImageUpload();
			}
			// なし
			else
			{
				TweetSend();
			}
*/

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
