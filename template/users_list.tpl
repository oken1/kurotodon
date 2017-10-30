	{foreach item=item from=$items}
	<div class='item' display_name='{$item->display_name}' id='{$item->id}' username='{$item->username}' instance='{$item->instance}' created_at='{$item->created_at}' avatar='{$item->avatar}'>
		<div class='avatar'>
			<img src='{$item->avatar}'>
		</div>
		<div class='container'>
			<div class='names'>
				<span class='display_name'>{$item->display_name_disp}</span> 
				<span class='username'>@{$item->username}@{$item->instance}</span>
			</div>
			<div class='counts'>
				(i18n_0367):{$item->statuses_count} (i18n_0125):{$item->following_count} (i18n_0122):{$item->followers_count}
			</div>
		</div>
		<div class='relationships {if $item->users_type=='search'}off{/if}'>
			{if $item->users_type=='follows'||$item->users_type=='followers'}<span class='icon-user-plus {if $item->on}on{/if}'></span>{/if}
			{if $item->users_type=='muteusers'}<span class='icon-volume-mute2 {if $item->on}on{/if}'></span>{/if}
			{if $item->users_type=='blockusers'}<span class='icon-eye-blocked {if $item->on}on{/if}'></span>{/if}
		</div>
	</div>
	{/foreach}
