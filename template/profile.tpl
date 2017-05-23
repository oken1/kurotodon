<div class='profilebase'>
	<div class='avatar'>
		<img src='{$avatar}'>
	</div>
	<div class='display_name'>
		<span>{$display_name}</span>
	</div>
	<div class='acct'>
		<span>@{$acct}</span><span> (ID:{$id})</span>
	</div>
	<div class='note'>
		<div>{$note}</div>
	</div>
	<div class='date'>
		<span>{$day}days ({$date} - )</span>
	</div>
	{if $myaccount}
	<div class='special'>
		<span class='favourites btn img icon-star tooltip' tooltip='(i18n_0403)'></span>
		<span class='muteusers btn img icon-volume-mute2 tooltip' tooltip='(i18n_0401)'></span>
		<span class='blockusers btn img icon-eye-blocked tooltip' tooltip='(i18n_0402)'></span>
	</div>
	{/if}
	<div class='stats'>
		<div>
			<span>(i18n_0367)</span>
			<span>{$statuses_count}</span>
		</div>
		<div>
			<span>(i18n_0125)</span>
			<span class='following_count'>{$following_count}</span>
		</div>
		<div>
			<span>(i18n_0122)</span>
			<span class='followers_count'>{$followers_count}</span>
		</div>
	</div>
</div>
