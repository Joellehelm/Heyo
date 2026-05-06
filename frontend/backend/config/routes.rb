Rails.application.routes.draw do
  namespace :api do
    resources :notes, only: %i[index create update destroy]
  end

  get "/up", to: proc { [200, { "Content-Type" => "application/json" }, ['{"status":"ok"}']] }
end
