module Katello
  class ContentViewVersionComparePresenter
    def initialize(content_item, content_view_versions, repository)
      @item = content_item
      @versions = content_view_versions
      @repository = repository
    end

    def comparison
      if @item.is_a?(::Katello::PuppetModule)
        item_repos = @item.content_view_puppet_environments
      else
        item_repos = @item.repositories
        item_repos.where(:library_instance_id => @repository.id) if @repository
      end

      item_repos.map(&:content_view_version_id) & @versions.map(&:id)
    end

    def respond_to?(method)
      return method.to_s == 'comparison' || @item.respond_to?(method)
    end

    def method_missing(*args, &block)
      @item.send(*args, &block)
    end
  end
end
