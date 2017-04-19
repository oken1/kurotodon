{foreach item=item from=$items}
<div class='item'>
	<div class='icon'>
		<img src='{$item->icon}'>
	</div>
	<div class='screen_name tooltip' tooltip='{$item->name}'>
		{$item->screen_name}
		{if $item->ismutual}<span class='icon-arrow-left'></span><span class='icon-arrow-right'></span>{/if}
		{if $item->isfriend}<span class='icon-arrow-left'></span>{/if}
		{if $item->isfollower}<span class='icon-arrow-right'></span>{/if}
	</div>
	<div class='friends'>
		{$item->friends}
	</div>
	<div class='followers'>
		{$item->followers}
	</div>
	<div class='btn follow_btn'>
	</div>
</div>
