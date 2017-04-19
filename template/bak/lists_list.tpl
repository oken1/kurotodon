	{foreach item=item from=$items}
	<div class='item' screen_name='{$item->user->screen_name}' user_id='{$item->user->id_str}' list_id='{$item->id_str}'>
		<div class='icon'>
			<img src='{$item->user->profile_image_url_https}'>
		</div>
		<div class='container'>
			<div class='fullname' screen_name='{$item->user->screen_name}' slug='{$item->slug}' name='{$item->name}' mylist='{$item->mylist}'>
				<span>@{$item->user->screen_name}/{$item->name}</span>{if $item->mode=='private'}<span class='icon-lock'></span>{/if}
			</div>
			<div class='desc'>
				{if $item->description}{$item->description}{else}<br>{/if}
			</div>
		</div>
		<div class='buttons'>
			<a class='btn del'>(i18n_0223)</a>
			<a class='btn toolbarlist'>{if $item->toolbarlist}(i18n_0091){else}(i18n_0092){/if}</a>
		</div>
	</div>
	{/foreach}
