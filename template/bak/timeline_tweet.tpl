<div class='item{if $warning} warning{/if}' screen_name='{$screen_name}' user_id='{$user_id}' status_id='{$status_id}' {if $rt_id!=''}rt_id='{$rt_id}' {/if}created_at='{$created_at}' protected='{if $protected}true{else}false{/if}'>
	<div class='icon'>
		{if $friends!='-'}<img class='tooltip' src='{$icon}' tooltip='(i18n_0083):{$statuses_count} (i18n_0125):{$friends} (i18n_0122):{$followers}'>{else}<img src='{$icon}'>{/if}
		{if $rt_flg}
		<div class='retweet tooltip' tooltip='(i18n_0001)' rt_user_id='{$rt_user_id}' rt_screen_name='{$rt_screen_name}'>
			<img src='{$rt_icon}' class='rt_icon'>
		</div>
		{/if}
	</div>
	<div class='tweet'>
		<div class='headcontainer'>
			<div class='namedate'>
				{if $namedisp==0}
					<span class='atmark ndr'>@</span><span class='screen_name ndr'>{$screen_name}</span> {if $name}<span class='name ndr'>{$name}</span>{/if}
				{else}
					{if $name}<span class='name drc'>{$name}</span>{/if}<span class='atmark drc'> @</span><span class='screen_name drc'>{$screen_name}</span>
				{/if}
				{if $protected}<span class='icon-lock' class='tooltip' tooltip='(i18n_0266)'></span>{/if}
				{if $verified}<img src='images/verified.png' class='tooltip' tooltip='(i18n_0263)'>{/if}
				{if $ismutual}<span class='icon-arrow-left'></span><span class='icon-arrow-right'></span>{/if}
				{if $isfriend}<span class='icon-arrow-left'></span>{/if}
				{if $isfollower}<span class='icon-arrow-right'></span>{/if}
				<br>
				<span class='date tooltip' absdate='{$absdate}' tooltip='{$date}'><a href='https://twitter.com/{$screen_name}/status/{$status_id}' target='_blank' class='anchor'>{$dispdate}</a></span><span class='source'>{$source}</span>
				<br>
				{if $rtcnt + 1 > 0 || $favcnt > 0}
				<span class='rtfav_cnt'>{if $rtcnt + 1 > 0}<span class='icon-loop'></span>:{$rtcnt + 1}{/if} {if $favcnt > 0}<span class='icon-heart'></span>:{$favcnt}{/if}</span>
				{/if}
			</div>
			<div class='options' mytweet='{$mytweet}' protected='{$protected}'>
				<span class='fav tooltip icon-heart {if $favorited}on{else}off{/if}' tooltip='(i18n_0054)'></span>
			</div>
		</div>

		<div class='tweet_text'>{$text}</div>

		{if $in_reply_to_status_id || $geo}
		<div class='bottomcontainer'>
			<div class='additional'>
				{if $in_reply_to_status_id}
				<div class='in_reply_to' status_id='{$in_reply_to_status_id}'>
					<span class='resicon icon-bubble tooltip' tooltip='(i18n_0277)'></span>
				</div>
				<div class='in_reply_to_close' status_id='{$in_reply_to_status_id}'>
					<span class='resicon icon-close tooltip' tooltip='(i18n_0273)'></span>
				</div>
				{/if}

				{if $geo}
				<div class='geo' geo='{$geo->coordinates}'>
					<span class='tooltip icon-place' tooltip='(i18n_0252)({$geo->coordinates})'></span>
				</div>
				{/if}
			</div>
		</div>
		{/if}

		<div class='bookmark nomark tooltip' tooltip='(i18n_0323)'></div>
	</div>
</div>
