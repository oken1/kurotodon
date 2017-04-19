{foreach item=item from=$items}
<div panel_id='{$item->panel_id}'>
	{if $item->icon}<span class='icon {$item->icon}'></span>{/if}
	<span class='badge'>{$item->badge}</span>
	<span class='title'>{$item->title}</span>
</div>
{/foreach}
