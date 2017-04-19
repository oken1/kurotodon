	{foreach item=item from=$items}
	<div class='item' pagetitle='{$item->title}' url='{$item->url}'>
		<div class='title'><span>{$item->title}</span></div>
		</div>
	</div>
	{/foreach}
