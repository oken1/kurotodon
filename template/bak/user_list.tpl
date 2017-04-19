	{foreach item=item from=$items}
	<div class='item' screen_name='{$item->screen_name}' user_id='{$item->user_id}' created_at='{$item->created_at}'>
		<div class='icon' tooltip='{$item->screen_name}'>
			<img src='{$item->icon}'>
		</div>
		<div class='container'>
			<div class='names'>
				<span class='screen_name'>{$item->screen_name}</span>{if $item->name} <span class='name'>({$item->name})</span>{/if}

				{if $item->protected}<span class='icon-lock' class='tooltip' tooltip='(i18n_0266)'></span>{/if}
				{if $item->verified}<img src='images/verified.png' class='tooltip' tooltip='(i18n_0263)'>{/if}
				{if $item->ismutual}<span class='icon-arrow-left'></span><span class='icon-arrow-right'></span>{/if}
				{if $item->isfriend}<span class='icon-arrow-left'></span>{/if}
				{if $item->isfollower}<span class='icon-arrow-right'></span>{/if}
			</div>
			<div class='counts'>
				(i18n_0083):{$item->count} (i18n_0125):{$item->follow} (i18n_0122):{$item->follower}
			</div>
			{if $item->description}
			<div class='desc'>
				{$item->description}
			</div>
			{/if}
		</div>
	</div>
	{/foreach}
