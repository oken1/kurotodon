"use strict";

////////////////////////////////////////////////////////////////////////////////
// ユニークID発行
////////////////////////////////////////////////////////////////////////////////
function GetUniqueID()
{
	var rnd = Math.floor( Math.random() * 10000 );
	var cur = new Date();
	var p = Date.parse( cur );
	p += cur.getMilliseconds();

	return rnd + p.toString();
}

////////////////////////////////////////////////////////////////////////////////
// 日付変換
// type = 0 : 絶対時間
//        3 : 絶対時間(1年以内の場合は年省略、同日の場合は月日も省略)
////////////////////////////////////////////////////////////////////////////////
function DateConv( src, type, digit )
{
	var time = Date.parse( src.replace( '+', 'GMT+' ) );
	var date = new Date();

	digit = digit || 4;

	if ( type == 0 || type == 3 )
	{
		date.setTime( time );
		var yyyy = ( "0000" + date.getFullYear() ).slice( -1 * digit ) + "/";
		var mmdd = ( "00" + ( date.getMonth() + 1 ) ).slice( -2 ) + "/" + ( "00" + date.getDate() ).slice( -2 ) + " ";

		if ( type == 3 )
		{
			var curdate = new Date();

			if ( Math.floor( ( curdate - date ) / 1000 ) < 60 * 60 * 24 * 365 )
			{
				yyyy = '';


				if ( curdate.getMonth() == date.getMonth() && curdate.getDate() == date.getDate() &&
					 curdate.getFullYear() == date.getFullYear() )
				{
					mmdd = '';
				}
			}
		}

		return yyyy + mmdd +
				( "00" + date.getHours() ).slice( -2 ) + ":" +
				( "00" + date.getMinutes() ).slice( -2 ) + ":" +
				( "00" + date.getSeconds() ).slice( -2 );
	}
}

////////////////////////////////////////////////////////////////////////////////
// 日時をyyyy/mm/dd hh:mm:ss形式で返す
////////////////////////////////////////////////////////////////////////////////
function DateYYYYMMDD( msec, digit )
{
	var date;

	if ( msec )
	{
		date = new Date( msec );
	}
	else
	{
		date = new Date();
	}

	return ( "0000" + date.getFullYear() ).slice( -1 * digit ) + "/" +
			( "00" + ( date.getMonth() + 1 ) ).slice( -2 ) + "/" +
			( "00" + date.getDate() ).slice( -2 ) + " " +
			( "00" + date.getHours() ).slice( -2 ) + ":" +
			( "00" + date.getMinutes() ).slice( -2 ) + ":" +
			( "00" + date.getSeconds() ).slice( -2 ) ;
}

////////////////////////////////////////////////////////////////////////////////
// 日付の差
////////////////////////////////////////////////////////////////////////////////
function CompareDate(year1, month1, day1, year2, month2, day2)
{
	var dt1 = new Date(year1, month1 - 1, day1);
	var dt2 = new Date(year2, month2 - 1, day2);
	var diff = dt1 - dt2;
	var diffDay = diff / 86400000;//1日は86400000ミリ秒
	return diffDay;
}


////////////////////////////////////////////////////////////////////////////////
// テキストからURLを抽出
////////////////////////////////////////////////////////////////////////////////
function GetURL( text )
{
	var urls = text.match( /(https?:\/\/){1}([-_.!~*\'()a-zA-Z0-9;\/?:\@&=+\$,%#]{1,})/g );

	// '
	return urls;
}

////////////////////////////////////////////////////////////////////////////////
// 数値に3桁ごとにカンマ
////////////////////////////////////////////////////////////////////////////////
function NumFormat( num )
{
	if ( num == null ) return "";

	return num.toString().replace( /([0-9]+?)(?=(?:[0-9]{3})+$)/g , '$1,' );
}

////////////////////////////////////////////////////////////////////////////////
// localStorage取得
////////////////////////////////////////////////////////////////////////////////
function getUserInfo( key )
{
	if ( localStorage[key] )
	{
		return localStorage[key];
	}
	else
	{
		return "";
	}
}

////////////////////////////////////////////////////////////////////////////////
// localStorage設定
////////////////////////////////////////////////////////////////////////////////
function setUserInfo( key, val )
{
	localStorage[key] = val;
}

////////////////////////////////////////////////////////////////////////////////
// localStorage消去
////////////////////////////////////////////////////////////////////////////////
function clearUserInfo( key )
{
	localStorage.removeItem( key );
}


////////////////////////////////////////////////////////////////////////////////
// htmlエスケープ
////////////////////////////////////////////////////////////////////////////////
function escapeHTML( _strTarget )
{
	var div = document.createElement('div');
	var text =  document.createTextNode('');
	div.appendChild(text);
	text.data = _strTarget;

	var ret = div.innerHTML;
	ret = ret.replace( /\"/g, '&quot;' );	// "
	ret = ret.replace( /\'/g, '&#39;' );	// '

	return ret;
}

////////////////////////////////////////////////////////////////////////////////
// 絵文字対応substring
////////////////////////////////////////////////////////////////////////////////
function uc_substring( string, start, end )
{
	var accumulator = "";
	var character;
	var stringIndex = 0;
	var unicodeIndex = 0;
	var length = string.length;

	while ( stringIndex < length )
	{
		character = uc_charAt( string, stringIndex );

		if ( unicodeIndex >= start && unicodeIndex < end )
		{
			accumulator += character;
		}

		stringIndex += character.length;
		unicodeIndex += 1;
	}

	return accumulator;
}

function uc_charAt( string, index ) {
	var first = string.charCodeAt( index );
	var second;

	if ( first >= 0xD800 && first <= 0xDBFF && string.length > index + 1 )
	{
		second = string.charCodeAt( index + 1 );

		if ( second >= 0xDC00 && second <= 0xDFFF )
		{
			return string.substring( index, index + 2 );
		}
	}

	return string[index];
}

