require 'eventmachine'
require 'game_object'
require 'explosion'
require 'logging'

class Bomb
  include GameObject
  include Logging

  def initialize(game, coordinates, explosions_size = 3, &block)
    super(game, coordinates)
    @explosions_size = explosions_size
    game.add_timer(3) { explode }
    @explode_callbacks = Array.new
    @after_explosion_callback = block if block_given?
  end

  def explode
    info("Booooooooooooooooom")
    delete
    x, y = coordinates
    add_explosion_at(x, y)
    # up
    @explosions_size.times do |size|
      break unless add_explosion_at(x, y - (size + 1))
    end
    # down
    @explosions_size.times do |size|
      break unless add_explosion_at(x, y + (size + 1))
    end
    # right
    @explosions_size.times do |size|
      break unless add_explosion_at(x + (size + 1), y)
    end
    # left
    @explosions_size.times do |size|
      break unless add_explosion_at(x - (size + 1), y)
    end
    @explode_callbacks.each { |cb| cb.call(self) }
  end

  def on_explode(&block)
    @explode_callbacks << block
  end

  def add_explosion_at(x, y)
    if game.non_destroyable_object_at? x, y
      false
    else
      old_destroyable = game.destroyable_objects_at? x, y
      explosion = Explosion.new(game, [x, y], 1, @after_explosion_callback)
      explosion.add_to_game.send_position
      # return value indicates if explosion can go through
      !old_destroyable
    end
  end

  def solid?
    true
  end

  def destroyable?
    false
  end
end
