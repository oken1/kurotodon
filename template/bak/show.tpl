{if $header}
<div class='header'>
	<div>
		<div class='icon'>
			{if $icon}
			<img src='{$icon}'>
			{/if}
		</div>
	</div>

	<div class='overlay'>
	</div>

	<div class='desc'>
		<div>
			{if $name}
			<div class='name'>
				{$name}{if $protected}<span class='icon-lock'></span>{/if}{if $verified}<img src='images/verified.png'>{/if}
			</div>
			{/if}
		</div>
		<div>
			<div class='screen_name'>
				<a>@{$screen_name}</a> (ID:{$id})
			</div>
		</div>
		<div>
			{if $description}
			<div class='description'>
				{$description}
			</div>
			{/if}
		</div>
		<div>
			<div class='locurl'>
				{if $location}{$location} {/if}{if $url}{$url}{/if}
			</div>
		</div>
	</div>
</div>
<div class='showcontainer'>
	<div class='desc'>
		{if $hist}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0038):</div><div class='desccont'>{$hist}</div>
		</div>
		{/if}
		{if $latest}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0221):</div><div class='desccont'>{if $latest_date}{$latest_date}<br>{/if}{$latest}</div>
		</div>
		{/if}
	</div>
</div>
{else}
<div class='showcontainer'>
	<div class='icon'>
		{if $icon}
		<img src='{$icon}'>
		{/if}
	</div>
	<div class='desc'>
		{if $name}
		<div class='name'>
			{$name}{if $protected}<span class='icon-lock'></span>{/if}{if $verified}<img src='images/verified.png'>{/if}
		</div>
		{/if}
		<div class='screen_name'>
			<a>@{$screen_name}</a> (ID:{$id})
		</div>
		{if $location}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0233):</div><div class='desccont'>{$location}</div>
		</div>
		{/if}
		{if $url}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0040):</div><div class='desccont'>{$url}</div>
		</div>
		{/if}
		{if $description}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0227):</div><div class='desccont'>{$description}</div>
		</div>
		{/if}
		{if $hist}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0038):</div><div class='desccont'>{$hist}</div>
		</div>
		{/if}
		{if $latest}
		<div class='desctbl'>
			<div class='desctitle'>(i18n_0221):</div><div class='desccont'>{if $latest_date}{$latest_date}<br>{/if}{$latest}</div>
		</div>
		{/if}
	</div>
</div>
{/if}
<div class='followcontainer'>
	<div>
		<div>(i18n_0083)</div>
		<div><a class='anchor tweets'>{$statuses_count}</a></div>
	</div>
	<div>
		<div>(i18n_0125)</div>
		<div><a class='anchor friends' number='{$friends_count}'>{$friends_count}</a></div>
	</div>
	<div>
		<div>(i18n_0122)</div>
		<div><a class='anchor followers' number='{$followers_count}'>{$followers_count}</a></div>
	</div>
	<div>
		<div>(i18n_0054)</div>
		<div><a class='anchor favourites'>{$favourites_count}</a></div>
	</div>
</div>
<div class='buttons others' id='{$id}'>
	<a class='btn follow' following='{$following}'>{if $following}(i18n_0135){else}(i18n_0128){/if}</a>
	<a class='btn block' blocking='{$blocking}'>{if $blocking}(i18n_0146){else}(i18n_0140){/if}</a>
	<a class='btn spam'>(i18n_0071)</a>
</div>
<div class='buttons me' id='{$id}'>
	<a class='btn saved_search'>(i18n_0207)</a>
</div>
