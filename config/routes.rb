Rails.application.routes.draw do
  resources :locations do
    member do
      delete 'destroy'
    end
  end
  # For details on the DSL available within this file, see https://guides.rubyonrails.org/routing.html
end
