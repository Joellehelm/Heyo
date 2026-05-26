class Note < ApplicationRecord
  COLORS = %w[banana bubblegum mint sky lavender peach].freeze
  ANIMAL_NAMES = {
    "fox" => "Red fox",
    "panda" => "Giant panda",
    "frog" => "Tree frog",
    "tiger" => "Tiger",
    "bear" => "Brown bear",
    "koala" => "Koala",
    "lion" => "Lion",
    "monkey" => "Capuchin monkey"
  }.freeze
  ANIMALS = ANIMAL_NAMES.keys.freeze

  validates :title, presence: true, length: { maximum: 80 }
  validates :body, length: { maximum: 1_000 }
  validates :color, inclusion: { in: COLORS }
  validates :animal, inclusion: { in: ANIMALS }

  before_validation :set_defaults

  def animal_name
    ANIMAL_NAMES.fetch(animal, ANIMAL_NAMES.fetch("fox"))
  end

  def as_json(options = {})
    super({ methods: :animal_name }.merge(options))
  end

  private

  def set_defaults
    self.title = "Untitled habitat note" if title.blank?
    self.body = "" if body.nil?
    self.color = COLORS.sample if color.blank?
    self.animal = ANIMALS.sample if animal.blank?
  end
end
